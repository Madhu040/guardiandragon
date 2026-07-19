/**
 * Play Together invite client.
 * Talks to `/api/together/rooms` so parent and child can join from different devices.
 * Falls back to localStorage only if the API is unreachable (same-browser demo).
 */

import { appConfig } from "../config/app.js";
import { newId } from "../util/id.js";

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

const ROOM_PREFIX = "trunorth_together_room_";
const SEAT_KEY = "trunorth_together_seat";

export const COLOR_TUNES: Record<
  ColorTuneId,
  { label: string; accent: string; soft: string }
> = {
  coral: { label: "Coral Glow", accent: "#e76f51", soft: "rgba(231,111,81,0.22)" },
  teal: { label: "Teal Calm", accent: "#2a9d8f", soft: "rgba(42,157,143,0.22)" },
  gold: { label: "Gold Courage", accent: "#ffd60a", soft: "rgba(255,214,10,0.28)" },
  violet: { label: "Violet Wonder", accent: "#9d4edd", soft: "rgba(157,78,221,0.25)" },
  sky: { label: "Sky Hope", accent: "#4cc9f0", soft: "rgba(76,201,240,0.25)" },
};

export const PLAYER_CHARACTERS: { id: PlayerCharacterId; emoji: string; label: string }[] = [
  { id: "companion_dragon", emoji: "🐉", label: "Dragon" },
  { id: "companion_fox", emoji: "🦊", label: "Fox" },
  { id: "companion_sprite", emoji: "✨", label: "Sprite" },
  { id: "wize", emoji: "🦉", label: "Owl" },
  { id: "helper_bear", emoji: "🐻", label: "Bear" },
];

function roomKey(code: string): string {
  return `${ROOM_PREFIX}${code.toUpperCase()}`;
}

export function getSeatId(): string {
  try {
    let id = sessionStorage.getItem(SEAT_KEY);
    if (!id) {
      id = newId();
      sessionStorage.setItem(SEAT_KEY, id);
    }
    return id;
  } catch {
    return newId();
  }
}

function apiBase(): string {
  return appConfig.apiUrl;
}

export function inviteUrl(code: string): string {
  const url = new URL(location.href);
  url.searchParams.set("together", "1");
  url.searchParams.set("invite", code.toUpperCase());
  return url.toString();
}

export function parseInviteFromUrl(search = location.search): string | null {
  const params = new URLSearchParams(search);
  const code = params.get("invite");
  return code ? code.toUpperCase() : null;
}

export function bothPlayersReady(room: TogetherRoom | null | undefined): boolean {
  return !!room && room.players.length === 2 && room.players.every((p) => p.ready);
}

type PlayerInput = Omit<TogetherPlayer, "ready" | "seatId"> & { seatId?: string };

function withSeat(player: PlayerInput): TogetherPlayer {
  return {
    ...player,
    seatId: player.seatId ?? getSeatId(),
    ready: true,
  };
}

function cacheRoom(room: TogetherRoom): void {
  try {
    localStorage.setItem(roomKey(room.code), JSON.stringify(room));
  } catch {
    // ignore quota
  }
}

function loadCachedRoom(code: string): TogetherRoom | null {
  try {
    const raw = localStorage.getItem(roomKey(code));
    return raw ? (JSON.parse(raw) as TogetherRoom) : null;
  } catch {
    return null;
  }
}

async function apiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error: body.error ?? `Request failed (${res.status})`,
        status: res.status,
      };
    }
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: "Cannot reach the server. Is the API running?", status: 0 };
  }
}

/** Create a room on the server (cross-device). Falls back to local-only if offline. */
export async function createRoom(
  host: PlayerInput,
): Promise<{ ok: true; room: TogetherRoom } | { ok: false; error: string }> {
  const player = withSeat(host);
  const result = await apiJson<{ room: TogetherRoom }>("/api/together/rooms", {
    method: "POST",
    body: JSON.stringify({ player }),
  });

  if (result.ok) {
    cacheRoom(result.data.room);
    return { ok: true, room: result.data.room };
  }

  if (result.status === 0) {
    // Offline / no API — local fallback so demo still works same-origin
    const code = generateLocalCode();
    const room: TogetherRoom = {
      code,
      createdAt: new Date().toISOString(),
      hostSeatId: player.seatId,
      status: "open",
      players: [player],
    };
    cacheRoom(room);
    return { ok: true, room };
  }

  return { ok: false, error: result.error };
}

function generateLocalCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export async function loadRoom(code: string): Promise<TogetherRoom | null> {
  const result = await apiJson<{ room: TogetherRoom }>(
    `/api/together/rooms/${encodeURIComponent(code.toUpperCase())}`,
  );
  if (result.ok) {
    cacheRoom(result.data.room);
    return result.data.room;
  }
  return loadCachedRoom(code);
}

export async function joinRoom(
  code: string,
  playerInput: PlayerInput,
): Promise<{ ok: true; room: TogetherRoom } | { ok: false; error: string }> {
  const player = withSeat(playerInput);
  const result = await apiJson<{ room: TogetherRoom }>(
    `/api/together/rooms/${encodeURIComponent(code.toUpperCase())}/join`,
    {
      method: "POST",
      body: JSON.stringify({ player }),
    },
  );

  if (result.ok) {
    cacheRoom(result.data.room);
    return { ok: true, room: result.data.room };
  }

  if (result.status === 0) {
    // Offline fallback — same browser/origin only
    const room = loadCachedRoom(code);
    if (!room) return { ok: false, error: "Invite not found. Start the API for cross-device invites." };
    if (room.status === "closed") return { ok: false, error: "This invite already finished." };
    const existing = room.players.find((p) => p.seatId === player.seatId);
    if (existing) return { ok: true, room };
    if (room.players.length >= 2) return { ok: false, error: "Someone already joined this invite." };
    if (room.players.some((p) => p.role === player.role)) {
      return { ok: false, error: `A ${player.role} seat is already taken. Pick the other role.` };
    }
    room.players.push(player);
    if (room.players.length === 2) room.status = "ready";
    cacheRoom(room);
    return { ok: true, room };
  }

  return { ok: false, error: result.error };
}

/**
 * Watch a room for partner join. Prefers SSE; falls back to polling.
 */
export function watchRoom(code: string, onUpdate: (room: TogetherRoom) => void): () => void {
  const upper = code.toUpperCase();
  let stopped = false;
  let es: EventSource | null = null;
  let pollTimer = 0;

  const emit = (room: TogetherRoom) => {
    if (stopped) return;
    cacheRoom(room);
    onUpdate(room);
  };

  const poll = async () => {
    const room = await loadRoom(upper);
    if (room) emit(room);
  };

  try {
    const streamUrl = `${apiBase()}/api/together/rooms/${encodeURIComponent(upper)}/stream`;
    es = new EventSource(streamUrl);
    es.addEventListener("room", (ev) => {
      try {
        emit(JSON.parse((ev as MessageEvent).data) as TogetherRoom);
      } catch {
        // ignore malformed
      }
    });
    es.onerror = () => {
      // Prefer polling if SSE dies (proxy / offline)
      es?.close();
      es = null;
      if (!stopped && !pollTimer) {
        void poll();
        pollTimer = window.setInterval(() => void poll(), 1500);
      }
    };
  } catch {
    es = null;
  }

  void poll();
  if (!es) {
    pollTimer = window.setInterval(() => void poll(), 1500);
  }

  // Same-tab localStorage fallback (offline rooms)
  const storageHandler = (e: StorageEvent) => {
    if (e.key === roomKey(upper) && e.newValue) {
      try {
        emit(JSON.parse(e.newValue) as TogetherRoom);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener("storage", storageHandler);

  return () => {
    stopped = true;
    es?.close();
    if (pollTimer) window.clearInterval(pollTimer);
    window.removeEventListener("storage", storageHandler);
  };
}
