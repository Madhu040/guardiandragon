# Server API (Hono)

**Sources:** `trunorth/server/main.ts`, `trunorth/server/index.ts`, `trunorth/server/config.ts`,
`trunorth/server/auth/jwt.ts`, `trunorth/server/db/migrate.ts`, `trunorth/server/routes/companion.ts`

## Boot

- `server/main.ts` — imports `db/migrate.js` (side-effect: opens/creates SQLite schema), then
  `serve({ fetch: app.fetch, port })` via `@hono/node-server`. Default port **3001**.
- `server/config.ts` — `serverConfig`: hand-rolled `.env` loader (no dotenv dependency; only fills
  keys not already in `process.env`), then typed getters for `port`, `host`, `jwtSecret`,
  `databasePath`, `corsOrigins` (comma list), and `companion.{apiKey, model, confidenceFloor, timeoutMs}`.
  Defaults: model `claude-3-5-haiku-latest`, floor `0.55`, timeout `8000ms`.

## Database (`server/db/migrate.ts`)

better-sqlite3, WAL mode, foreign keys on. Creates tables idempotently:

| Table | Purpose |
|---|---|
| `parents` | id, unique email, bcrypt `password_hash`, role (default `parent`) |
| `child_profiles` | parent-owned; display_name, age_band, avatar_json; cascade delete |
| `progress` | one row per child: `game_state_json` blob + `updated_at` |
| `audit_logs` | actor_id, action, resource_id, ip, timestamp |

Exports the open `db` handle. DB files live under `trunorth/data/` (git-ignored).

## Auth (`server/auth/jwt.ts`)

- `signToken(user)` — HS256 JWT via `jose`, 7-day expiry, claims `sub`/`email`/`role`.
- `verifyToken(token)` — returns `AuthUser | null` (never throws).

## Routes (`server/index.ts`)

CORS restricted to `serverConfig.corsOrigins`. `authMiddleware` = Bearer token → `verifyToken` → `c.set("user")`.

| Route | Auth | Behavior |
|---|---|---|
| `GET /api/health` | — | status, timestamp, companion model + `hasApiKey` flag |
| `POST /api/auth/register` | — | validates email + 8-char password, 409 on duplicate, bcrypt(12), returns `{token, user}` |
| `POST /api/auth/login` | — | bcrypt compare, returns `{token, user}` or 401 |
| `GET /api/auth/me` | Bearer | echoes verified user |
| `GET /api/children` | Bearer | list caller's child profiles |
| `POST /api/children` | Bearer | create profile (name ≤30 chars), writes `audit_logs` row |
| `GET /api/progress/:childId` | Bearer | ownership check, returns stored `GameState` JSON or null |
| `PUT /api/progress/:childId` | Bearer | ownership check, upsert `game_state_json` |
| `POST /api/companion` | optional | see pipeline below |
| `POST /api/reflect` | — | maps `{events:[{decisionPointId, scoreBand}]}` → `insightForStep` list + parent coaching + disclaimer. **No client caller yet.** |

> The client currently only calls `/api/companion` (LiveCompanionClient) and
> `/api/auth/*` (`src/ui/auth.ts`). Children/progress endpoints exist server-side but
> are not wired into the UI (client persistence is localStorage).

## Companion route (`server/routes/companion.ts`)

`POST /api/companion` pipeline:

1. Require `decisionPointId` + `sceneId` (400 otherwise).
2. `filterInput(childInput)` — on block: safety fallback line, `redirect: true`, band `partial`, original safety flag.
3. No `ANTHROPIC_API_KEY` → `scoreLocally` (keyword heuristic → band; insight-derived line).
4. Key present → Anthropic `messages.create` (max_tokens 420, AbortController timeout) with
   `buildSystemPrompt` (companion persona, strict boundaries, together-mode addendum,
   JSON-only response contract).
5. `parseModelResponse` — extract first `{...}` JSON, clamp line lengths (120/400/300); parse
   failure → `scoreLocally`.
6. `filterOutput` on companionLine + counselorInsight — unsafe → safety fallback + `off_topic` flag.
7. Confidence below `CONFIDENCE_FLOOR` → band forced `partial` + partial fallback line.
8. `enrichWithLocalInsight` — backfill counselorInsight/parentTip from `insightForStep`.
9. Any thrown error → `scoreLocally(req, "timeout")` with the per-DP `timeout` fallback line.

`getFallback(dpId, band)` reads `content/fallbacks/companion-fallbacks.json`
(strong/partial/poor/timeout/safety per DP, all 10 DPs covered) with a generic last-resort line.
