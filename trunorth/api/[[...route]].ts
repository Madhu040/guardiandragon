/**
 * Vercel Node.js Function entry point. Wraps the existing Hono `app`
 * (server/index.ts) so every `/api/*` route Vercel receives is forwarded to
 * it unchanged — the catch-all filename (`[[...route]]`) is what makes one
 * function handle every path under `/api`.
 *
 * Node runtime (not Edge) is required: `server/db/migrate.ts` opens a
 * better-sqlite3 file, which only runs under Node.
 */
import { handle } from "hono/vercel";
import { app } from "../server/index.js";

export const runtime = "nodejs";
export default handle(app);
