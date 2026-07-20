import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "./db/migrate.js";
import { signToken, verifyToken } from "./auth/jwt.js";
import { companionRoutes } from "./routes/companion.js";
import { togetherRoutes } from "./routes/together.js";
import { serverConfig } from "./config.js";
import type { AuthUser } from "../src/types/index.js";

type Variables = { user: AuthUser };

const app = new Hono<{ Variables: Variables }>();

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return serverConfig.corsOrigins[0] ?? "*";
    if (serverConfig.corsOrigins.includes(origin)) return origin;
    // Dev / LAN: allow phones opening http://192.168.x.x:5173
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
    if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return origin;
    }
    return serverConfig.corsOrigins[0] ?? origin;
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    service: "trunorth",
    timestamp: new Date().toISOString(),
    config: {
      companionModel: serverConfig.companion.model,
      hasApiKey: Boolean(serverConfig.companion.apiKey),
    },
  }),
);

// --- Parent Auth (parent-only; children never authenticate directly) ---

app.post("/api/auth/register", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();

  if (!email?.includes("@") || !password || password.length < 8) {
    return c.json({ error: "Valid email and password (8+ chars) required" }, 400);
  }

  const existing = db.prepare("SELECT id FROM parents WHERE email = ?").get(email);
  if (existing) return c.json({ error: "Email already registered" }, 409);

  const id = randomUUID();
  const hash = await bcrypt.hash(password, 12);
  db.prepare("INSERT INTO parents (id, email, password_hash) VALUES (?, ?, ?)").run(id, email, hash);

  const token = await signToken({ id, email, role: "parent" });
  return c.json({ token, user: { id, email, role: "parent" } }, 201);
});

app.post("/api/auth/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();

  const parent = db.prepare("SELECT * FROM parents WHERE email = ?").get(email) as {
    id: string; email: string; password_hash: string; role: string;
  } | undefined;

  if (!parent || !(await bcrypt.compare(password, parent.password_hash))) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = await signToken({
    id: parent.id,
    email: parent.email,
    role: parent.role as "parent",
  });
  return c.json({ token, user: { id: parent.id, email: parent.email, role: parent.role } });
});

app.get("/api/auth/me", async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return c.json({ error: "Unauthorized" }, 401);

  const user = await verifyToken(auth.slice(7));
  if (!user) return c.json({ error: "Invalid token" }, 401);
  return c.json({ user });
});

// Auth middleware for protected routes
const authMiddleware = async (c: Context<{ Variables: Variables }>, next: () => Promise<void>) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return c.json({ error: "Unauthorized" }, 401);

  const user = await verifyToken(auth.slice(7));
  if (!user) return c.json({ error: "Invalid token" }, 401);

  c.set("user", user);
  await next();
};

// --- Child Profiles (parent-managed) ---

app.get("/api/children", authMiddleware, (c) => {
  const user = c.get("user");
  const children = db.prepare(
    "SELECT id, display_name, age_band, avatar_json, created_at FROM child_profiles WHERE parent_id = ?",
  ).all(user.id);
  return c.json({ data: children });
});

app.post("/api/children", authMiddleware, async (c) => {
  const user = c.get("user");
  const { displayName, ageBand, avatarJson } = await c.req.json<{
    displayName: string; ageBand: string; avatarJson?: string;
  }>();

  if (!displayName || displayName.length > 30) {
    return c.json({ error: "Display name required (max 30 chars)" }, 400);
  }

  const id = randomUUID();
  db.prepare(
    "INSERT INTO child_profiles (id, parent_id, display_name, age_band, avatar_json) VALUES (?, ?, ?, ?, ?)",
  ).run(id, user.id, displayName, ageBand ?? "8-10", avatarJson ?? "{}");

  db.prepare(
    "INSERT INTO audit_logs (actor_id, action, resource_id) VALUES (?, ?, ?)",
  ).run(user.id, "child_profile.create", id);

  return c.json({ id, displayName, ageBand }, 201);
});

// --- Remote Progress (parent-authenticated) ---

app.get("/api/progress/:childId", authMiddleware, (c) => {
  const user = c.get("user");
  const childId = c.req.param("childId");

  const child = db.prepare(
    "SELECT id FROM child_profiles WHERE id = ? AND parent_id = ?",
  ).get(childId, user.id);
  if (!child) return c.json({ error: "Not found" }, 404);

  const row = db.prepare("SELECT game_state_json, updated_at FROM progress WHERE child_id = ?").get(childId) as
    | { game_state_json: string; updated_at: string } | undefined;

  if (!row) return c.json({ data: null });
  return c.json({ data: JSON.parse(row.game_state_json), updatedAt: row.updated_at });
});

app.put("/api/progress/:childId", authMiddleware, async (c) => {
  const user = c.get("user");
  const childId = c.req.param("childId");
  const { gameState } = await c.req.json<{ gameState: unknown }>();

  const child = db.prepare(
    "SELECT id FROM child_profiles WHERE id = ? AND parent_id = ?",
  ).get(childId, user.id);
  if (!child) return c.json({ error: "Not found" }, 404);

  db.prepare(`
    INSERT INTO progress (child_id, game_state_json, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(child_id) DO UPDATE SET game_state_json = excluded.game_state_json, updated_at = datetime('now')
  `).run(childId, JSON.stringify(gameState));

  return c.json({ ok: true });
});

app.route("/api", companionRoutes);
app.route("/api", togetherRoutes);

export { app };
