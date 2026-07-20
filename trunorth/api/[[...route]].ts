/**
 * Vercel Node.js Function entry point. Wraps the existing Hono `app`
 * (server/index.ts) so every `/api/*` route Vercel receives is forwarded to
 * it unchanged — the catch-all filename (`[[...route]]`) is what makes one
 * function handle every path under `/api`.
 *
 * Node runtime (not Edge) is required: `server/db/migrate.ts` opens a
 * better-sqlite3 file, which only runs under Node.
 *
 * Adapter: `@hono/node-server/vercel`, NOT `hono/vercel`. `hono/vercel`'s `handle`
 * is a bare `(req) => app.fetch(req)` — it assumes Vercel already hands the function
 * a Web-standard `Request`, which is only true for the Edge runtime. A `nodejs`
 * runtime function (required above for better-sqlite3) gets Node's classic
 * `(req, res)` objects instead, whose `req.headers` is a plain object with no
 * `.get()` method — confirmed live: Hono's CORS middleware crashed on
 * `this.raw.headers.get is not a function`, i.e. `req` wasn't a real `Request`.
 * `@hono/node-server`'s adapter (`getRequestListener` under the hood) is the one
 * built to convert Node's raw req/res into a proper Request/Response pair.
 */
import { handle } from "@hono/node-server/vercel";
import { app } from "../server/index.js";

export const runtime = "nodejs";
export default handle(app);
