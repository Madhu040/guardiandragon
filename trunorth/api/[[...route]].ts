/**
 * Vercel Node.js Function entry point. Wraps the existing Hono `app`
 * (server/index.ts) so every `/api/*` route Vercel receives is forwarded to
 * it unchanged — the catch-all filename (`[[...route]]`) is what makes one
 * function handle every path under `/api`.
 *
 * Node runtime (not Edge) is required: `server/db/migrate.ts` opens a
 * better-sqlite3 file, which only runs under Node.
 *
 * Adapter history — two prior attempts, each fixed one bug and surfaced the next:
 *
 * 1. `hono/vercel`'s `handle` is a bare `(req) => app.fetch(req)` — it assumes Vercel
 *    already hands the function a Web-standard `Request`, true only for the Edge
 *    runtime. This function needs the `nodejs` runtime (better-sqlite3's native
 *    binary can't run on Edge), which instead gives Node's classic `(req, res)`,
 *    whose `req.headers` is a plain object with no `.get()` — confirmed live via
 *    `TypeError: this.raw.headers.get is not a function` inside Hono's CORS
 *    middleware.
 * 2. `@hono/node-server/vercel`'s `handle` fixed that (GET /api/health went 200) but
 *    every POST hung indefinitely — confirmed live (multiple 15-20s timeouts, zero
 *    response) and isolated to the method, not the body content (a bodyless POST
 *    hung identically to one with JSON). Root cause: Vercel's Node Functions
 *    auto-parse a JSON body into `req.body` for convenience, which drains the
 *    underlying raw request stream in the process. `@hono/node-server`'s adapter
 *    then tries to read that *same* stream itself to build the Fetch `Request`
 *    body — reading from an already-drained stream that will never emit further
 *    data, hanging forever.
 *
 * This handler sidesteps both: it builds the Fetch `Request`/`Response` itself,
 * using Vercel's already-parsed `req.body` directly (no second stream read) when
 * present, falling back to reading the raw stream only if Vercel didn't pre-parse
 * it (e.g. local `vite dev`/`vite preview`, which never populates `req.body`).
 */
import type { IncomingMessage, ServerResponse } from "http";
import { app } from "../server/index.js";

export const runtime = "nodejs";

function buildHeaders(raw: IncomingMessage["headers"]): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) headers.set(key, value.join(", "));
    else if (value !== undefined) headers.set(key, value);
  }
  return headers;
}

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

/** Vercel's Node Helpers pre-parse JSON/text/urlencoded bodies onto `req.body`. */
function resolveBodyFromVercel(req: IncomingMessage & { body?: unknown }): string | undefined {
  if (req.body === undefined || req.body === null) return undefined;
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  return JSON.stringify(req.body);
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `https://${host}`);
  const method = req.method ?? "GET";
  const headers = buildHeaders(req.headers);

  let body: string | Buffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const preParsed = resolveBodyFromVercel(req as IncomingMessage & { body?: unknown });
    body = preParsed !== undefined ? preParsed : await readRawBody(req);
  }

  const request = new Request(url, { method, headers, body });
  const response = await app.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}
