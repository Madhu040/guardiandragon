/**
 * Play Together invite rooms — shareable codes that work across devices.
 * Guest-friendly (no auth). Rooms auto-expire after ROOM_TTL_MS.
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { db } from "../db/migrate.js";

export type TogetherRole = "parent" | "child";
export type ColorTuneId = "coral" | "teal" | "gold" | "violet" | "sky";
export type PlayerCharacterId =
  | "companion_dragon"
  | "companion_fox"
  | "companion_sprite"
  | "wize"
  | "helper_bear";

export interface TogetherPlayer {
  role: TogetherRole;
  displayName: string;
  colorTune: ColorTuneId;
  characterId: PlayerCharacterId;
  skinTone: "tone_1" | "tone_2" | "tone_3" | "tone_4" | "tone_5";
  ready: boolean;
  seatId: string;
}

export interface TogetherRoom {
  code: string;
  createdAt: string;
  hostSeatId: string;
  players: TogetherPlayer[];
  status: "open" | "ready" | "closed";
}

const ROOM_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

db.exec(`
  CREATE TABLE IF NOT EXISTS together_rooms (
    code TEXT PRIMARY KEY,
    host_seat_id TEXT NOT NULL,
    players_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );
`);

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function expiresAtIso(from = Date.now()): string {
  return new Date(from + ROOM_TTL_MS).toISOString();
}

function rowToRoom(row: {
  code: string;
  host_seat_id: string;
  players_json: string;
  status: string;
  created_at: string;
}): TogetherRoom {
  return {
    code: row.code,
    hostSeatId: row.host_seat_id,
    players: JSON.parse(row.players_json) as TogetherPlayer[],
    status: row.status as TogetherRoom["status"],
    createdAt: row.created_at,
  };
}

function purgeExpired(): void {
  db.prepare("DELETE FROM together_rooms WHERE expires_at < datetime('now')").run();
}

function getRoom(code: string): TogetherRoom | null {
  purgeExpired();
  const row = db
    .prepare(
      "SELECT code, host_seat_id, players_json, status, created_at FROM together_rooms WHERE code = ?",
    )
    .get(code.toUpperCase()) as
    | {
        code: string;
        host_seat_id: string;
        players_json: string;
        status: string;
        created_at: string;
      }
    | undefined;
  return row ? rowToRoom(row) : null;
}

function saveRoom(room: TogetherRoom): void {
  db.prepare(
    `INSERT INTO together_rooms (code, host_seat_id, players_json, status, created_at, updated_at, expires_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
     ON CONFLICT(code) DO UPDATE SET
       players_json = excluded.players_json,
       status = excluded.status,
       updated_at = datetime('now')`,
  ).run(
    room.code,
    room.hostSeatId,
    JSON.stringify(room.players),
    room.status,
    room.createdAt,
    expiresAtIso(),
  );
}

function isPlayerShape(p: unknown): p is Omit<TogetherPlayer, "ready"> {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    (o.role === "parent" || o.role === "child") &&
    typeof o.displayName === "string" &&
    o.displayName.trim().length > 0 &&
    o.displayName.length <= 24 &&
    typeof o.colorTune === "string" &&
    typeof o.characterId === "string" &&
    typeof o.skinTone === "string" &&
    typeof o.seatId === "string" &&
    o.seatId.length > 0
  );
}

export const togetherRoutes = new Hono();

togetherRoutes.post("/together/rooms", async (c) => {
  let playerRaw: unknown;
  try {
    const body = await c.req.json<{ player?: unknown }>();
    playerRaw = body.player;
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (!isPlayerShape(playerRaw)) {
    return c.json({ error: "Valid player (role, name, seatId, style) required" }, 400);
  }

  let code = generateCode();
  for (let i = 0; i < 8 && getRoom(code); i++) code = generateCode();

  const host: TogetherPlayer = {
    ...playerRaw,
    displayName: playerRaw.displayName.trim(),
    ready: true,
  };
  const room: TogetherRoom = {
    code,
    createdAt: new Date().toISOString(),
    hostSeatId: host.seatId,
    players: [host],
    status: "open",
  };
  saveRoom(room);
  return c.json({ room }, 201);
});

togetherRoutes.get("/together/rooms/:code", (c) => {
  const room = getRoom(c.req.param("code"));
  if (!room) return c.json({ error: "Invite not found or expired" }, 404);
  return c.json({ room });
});

togetherRoutes.post("/together/rooms/:code/join", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const room = getRoom(code);
  if (!room) return c.json({ error: "Invite not found. Ask your partner for a fresh code." }, 404);
  if (room.status === "closed") return c.json({ error: "This invite already finished." }, 409);

  let playerRaw: unknown;
  try {
    const body = await c.req.json<{ player?: unknown }>();
    playerRaw = body.player;
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (!isPlayerShape(playerRaw)) {
    return c.json({ error: "Valid player required" }, 400);
  }

  const existing = room.players.find((p) => p.seatId === playerRaw.seatId);
  if (existing) return c.json({ room });

  if (room.players.length >= 2) {
    return c.json({ error: "Someone already joined this invite." }, 409);
  }
  if (room.players.some((p) => p.role === playerRaw.role)) {
    return c.json(
      { error: `A ${playerRaw.role} seat is already taken. Pick the other role.` },
      409,
    );
  }

  room.players.push({
    ...playerRaw,
    displayName: playerRaw.displayName.trim(),
    ready: true,
  });
  if (room.players.length === 2) room.status = "ready";
  saveRoom(room);
  return c.json({ room });
});

togetherRoutes.post("/together/rooms/:code/close", (c) => {
  const room = getRoom(c.req.param("code"));
  if (!room) return c.json({ error: "Not found" }, 404);
  room.status = "closed";
  saveRoom(room);
  return c.json({ room });
});

/** Live updates for waiting room (cross-device). */
togetherRoutes.get("/together/rooms/:code/stream", (c) => {
  const code = c.req.param("code").toUpperCase();
  return streamSSE(c, async (stream) => {
    let lastJson = "";
    for (let i = 0; i < 240; i++) {
      // ~6 minutes of SSE; client can reconnect
      const room = getRoom(code);
      if (!room) {
        await stream.writeSSE({ event: "gone", data: JSON.stringify({ error: "gone" }) });
        break;
      }
      const json = JSON.stringify(room);
      if (json !== lastJson) {
        lastJson = json;
        await stream.writeSSE({ event: "room", data: json });
      }
      await stream.sleep(1200);
    }
  });
});
