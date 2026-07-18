# TruNorth — Product Context (`product.md`)

> **Living implementation ledger.** This file is the single high-level, always-current
> picture of **what actually exists in `trunorth/` right now** — files, methods,
> and functionality. Design intent lives in [`docs/README.md`](./docs/README.md) and the
> specs under [`docs/specs/`](./docs/specs/) (primary:
> [`TruNorth Technical Specification.md`](./docs/specs/TruNorth%20Technical%20Specification.md)).
> This file is not a plan — reality always wins here.

---

## Team roles & task board

Each teammate has one active to-do. Tasks come from the current gaps in Section 3
(⬜ / 🟨 items and pending work). Check a task off only when the matching Section 3
entry is updated in the same change.

> **🔧 = actively being worked on.** The folder tree (Section 2) and component entries
> (Section 3) are tagged `🔧 <name>` wherever someone on this board is currently
> working. Check for a 🔧 tag before touching an area — coordinate with the owner first.

### Ermoni — Backend (Supabase, first iteration: level images) 🔧

- [ ] Get Supabase connected to the app and storing the **level / zone images** (start with
  Level 1 The Singing Bridge / Everbright), so the app can pull the right images per
  level when needed — **without breaking** the fully-offline demo path (`?demo=1` +
  `public/assets/zones/`). Design the visuals together with Gabby, based on
  [`docs/scripts/Scene, script, players.docx`](./docs/scripts/Scene,%20script,%20players.docx) (Vandy).

### Gabby — Backend (Supabase level images, with Ermoni) 🔧

- [ ] Design the SVG / asset frames for Level 1 (bridge, Flicker, Wize, Shimmer Crystal)
  from Vandy’s Singing Bridge script, and work with Ermoni to store them in Supabase
  and wire pull-per-level in the app (keep local placeholders as offline fallback).

### Daniel — Frontend (Level 1 content + gameplay UX)

- [x] ~~Ship Level 1 **The Singing Bridge** from Vandy’s script into playable content~~
  (W1→W6 scenes, DPs, Flicker/Wize cast, multi-tap breathe/crossing, celebration,
  insights/fallbacks/demo bundle) — done 2026-07-13.
- [x] ~~Ship world movement + environment interact~~ (WASD/arrows, collision, E/Space,
  companion follow, sparks) — done 2026-07-14.
- [ ] Next: polish Level 1 play feel — expression changes along Flicker’s arc, richer
  investigation hotspots, and optional TileMap rooms if the team adopts grid levels.
  Also: fix the 11 open `npm run typecheck` errors (see §3.14) so CI goes green.
- **Files owned:** `trunorth/content/chapters/ch2/*`, `trunorth/src/engine/*`,
  `trunorth/src/input/InputController.ts`, `trunorth/src/ui/GameView.ts`,
  `trunorth/src/render/characters.ts`, `trunorth/src/content/{index,scenarios,zones}.ts`.

### Jose — Frontend (deployment) 🔧

- [ ] Deploy the app so users can play and test it: stand up a hosted environment
  for the **Vite client + Hono API** (`trunorth/server/`), configure env vars from
  `trunorth/.env.example`, verify health + `/api/companion` in production, and share
  the test URL (demo mode: `?demo=1`) with the team.

### Vandy — Product management (research & game vision)

- [x] ~~Deliver Level 1 script~~ — [`docs/scripts/Scene, script, players.docx`](./docs/scripts/Scene,%20script,%20players.docx)
  (The Singing Bridge: Flicker, Wize, Courage Feather) — done; content integrated.
- [ ] Research how existing SEL products — especially **GoZen!** — teach hard emotional
  skills to kids, and turn findings into vision for Levels 2+ (still feed Ermoni/Gabby
  for art, and Daniel for scene scripting).

### Ranya — Product management (research & testing criteria)

- [ ] Research (alongside Vandy) how programs like **GoZen!** teach emotional skills
  through simple formats, and translate findings into **test criteria for Level 1**:
  what “good” looks like when playing The Singing Bridge on this basic 2D DOM game
  (attention, clarity of choices, emotional beat landing, Courage Feather payoff).

### Madhu — Product management (PR support & spec alignment)

- [ ] Provide continuous support across the team: help review and shepherd pull
  requests, and make sure work stays aligned with
  `docs/specs/TruNorth Technical Specification.md` (intent) and **this `product.md`** (what’s built).
  Prefer PRs that update `product.md` in the same change when files/behavior move.

---

## 0. How to use and maintain this file (read before editing)

These rules exist so `product.md` stays trustworthy and consistent across every pull request.

1. **This file describes reality, not intent.** The technical specification says what the
   product *should* be; `product.md` records what has *actually been built*. If it isn't
   in the repo and working, it does not get a "done" description here.

2. **Update it in the same change set as the code.** Any PR that adds, removes, or changes
   a file, method, or behavior in `trunorth/` must update the matching section here in the
   same PR. Treat an out-of-date `product.md` as a broken build.

3. **Keep entries short and factual.** For each implemented file: its path, its purpose in
   one line, and its key exports (functions/classes/methods) with a one-line description
   each. No design rationale, no future plans — those live in the spec.

4. **Never delete an empty section.** `⬜` is a truthful signal that nothing is built
   there yet. Sections grow from `⬜` → `🟨` → `✅` as real code lands.

5. **Offload depth to context files.** When an entry would exceed ~15 lines or needs
   tables/diagrams/method-by-method walkthroughs, move the detail to
   [`docs/context/`](./docs/context/)`<area>-<subject>.md` (the file states which sources
   it documents at the top), keep a one-line summary + link here, and add a row to
   Section 4.

6. **Mirror the real folder structure.** Section 2 must always reflect the actual
   directory tree of `trunorth/`.

7. **Status legend** (use these consistently):
   - `⬜ Not implemented` — scaffolding only, or doesn't exist yet.
   - `🟨 Partial` — some functionality exists; note what's missing.
   - `✅ Implemented` — built and working; describe methods/functionality.

8. **When this file and the spec disagree:** this file wins for "what is built"; the spec
   wins for "what is intended."
   **Repo layout note (2026-07-13):** older drafts referred to `TruNorthProject/` with
   TileMap / Vercel `api/` / rAF loop. That tree is not in this repository. The working
   app is `trunorth/` (DOM scenes + Hono server). Do not reintroduce phantom folders.

---

## 1. Snapshot

| Field | Value |
|---|---|
| Product | TruNorth — choice-driven social-emotional learning (SEL) narrative for ages 5–15 |
| Project root | `trunorth/` (repo root = DallasAITeam15 monorepo wrapper) |
| Spec source of truth | `docs/README.md` + `docs/specs/` (intent) |
| Level 1 script | `docs/scripts/Scene, script, players.docx` → **The Singing Bridge** (integrated) |
| Overall implementation status | **🟨 Playable MVP, DOM-scene model.** Two child levels, both grid-backed (**ch1 Everbright Meadow**, **ch2 The Singing Bridge golden path W1→W7** — Wize is the guiding companion, Flicker the dragon physically blocks the bridge until the final walk-across finish; ch3 forest removed 2026-07-17) + parent coach entry; scene engine with multi-tap/repair; **WASD/arrow world movement with collision, companion follow, collectibles**; **parameterized 100×100 grid levels (per-cell color + walkability, canvas background, center-point collision) — every scene binds a grid via `gridMapId`, hub cards show grid thumbnails**; companion safety filters + demo/live clients; counselor insights + Together Mode; **pre-level check-in (3 open-ended questions → 0–10 starting point + bright/steady/gentle placement, fed into journey reflection)**; **declarative stage objects (grid-cell-placed interactables: multi-page dialogs + finish lines that advance/complete a stage — pure JSON authoring)**; local/demo persistence; **Hono API with parent auth, child profiles, remote-progress endpoints (server-built, client not wired), companion + reflect routes, SQLite**; Docker; 36 unit tests + content validate. **Not built:** Supabase assets, hosted deploy, client remote sync, e2e/red-team suites, JSON-Schema CI. **Known broken:** `npm run typecheck` fails (9 errors — see §3.14), so CI is red. Art is grid canvases + inline SVG cast (8-bit pixel-art style); zone PNGs remain for celebration + fallback. |
| Toolchain | Node ≥20 (`.nvmrc` 22), Vite 6, TypeScript 5.8, Vitest 3, Hono, better-sqlite3, jose, bcryptjs, tsx |
| Quick test | `cd trunorth && npm install && npm run demo` → http://localhost:4173/?demo=1 (verified: build + preview work) |
| Last updated | 2026-07-18 (ch2 role fix: Wize = companion, Flicker blocks the bridge; new w7 walk-to-checkmark finish) |

---

## 2. Folder structure

### Repo root

```
DallasAITeam15/
├── product.md                 # Living ledger + task board (this file)
├── README.md
├── docs/
│   ├── README.md              # Design intent overview
│   ├── specs/                 # Technical specifications
│   ├── scripts/               # Narrative scripts (Singing Bridge, …)
│   ├── kickoff/               # Team slides
│   └── context/               # Deep-dive context files (Section 4)
└── trunorth/                  # Application (configurable via .env)
```

### Application (`trunorth/` tree)

```
trunorth/
├── content/
│   ├── chapters/ch1/          # ✅ Everbright Meadow — e1–e3 + 2 DPs + 1 dialog + 3 stage objects
│   ├── chapters/ch2/          # ✅ Singing Bridge — w1–w7 + 6 DPs + 1 dialog + 2 stage objects
│   ├── demo/showcase.bundle.json     # ✅ 10 canned companion lines (demo mode)
│   └── fallbacks/companion-fallbacks.json  # ✅ band/timeout/safety lines, all 10 DPs
├── data/                      # SQLite runtime files (git-ignored)
├── public/
│   ├── assets/zones/          # 🟨 meadow/forest/cave/mountain PNG placeholders 🔧 Ermoni+Gabby
│   ├── favicon.svg
│   └── manifest.json          # PWA manifest (note: main.ts registers /sw.js, which doesn't exist)
├── scripts/
│   └── validate-content.ts    # 🟨 structural checks (no Ajv schemas yet)
├── api/
│   └── [[...route]].ts        # ✅ Vercel Node Function — forwards /api/* to the Hono `app`
├── server/                    # ✅ Hono API (dev: tsx watch) 🔧 Jose (deploy)
│   ├── auth/jwt.ts            # HS256 sign/verify (jose)
│   ├── config.ts              # ✅ .env loader + serverConfig
│   ├── db/migrate.ts          # SQLite schema (parents, children, progress, audit)
│   ├── routes/companion.ts    # POST /api/companion + /api/reflect
│   ├── index.ts               # health, auth, children, progress routes + CORS
│   └── main.ts                # listen entry (port 3001)
├── src/
│   ├── main.ts                # ✅ Boot, screens, startScenario, engine + world wiring
│   ├── companion/CompanionClient.ts   # ✅ Live + Demo clients
│   ├── config/                # ✅ app.ts, content.ts, gameState.ts (env-driven)
│   ├── content/               # ✅ SCENES/DPs/DIALOGS registry, scenarios, zones, gridLevels, stageObjects
│   ├── counselor/             # ✅ insights + coPlay discuss prompts + pre-level checkin
│   ├── engine/                # ✅ SceneEngine, DecisionResolver, WorldRuntime, Collision, GridMap
│   ├── input/InputController.ts # ✅ WASD/arrows + interact keys
│   ├── render/                # ✅ characters.ts (SVG cast), gridBackground.ts (grid canvas)
│   ├── safety/filters.ts      # ✅ input/output filters
│   ├── store/ProgressStore.ts # ✅ Local + Demo stores
│   ├── styles/global.css      # ✅ Layout, HUD, overlays, zones; stage container-scaled (--px)
│   ├── types/index.ts         # ✅ Shared contracts
│   └── ui/                    # ✅ GameView, screens, auth helpers
├── tests/unit/                # ✅ 36 tests — engine (13) + grid (7) + checkin (6) + stageObjects (10)
├── Dockerfile · docker-compose.yml
├── index.html · vite.config.ts · vitest.config.ts
├── tsconfig.json · tsconfig.server.json · tsconfig.api.json  # api.json = typecheck-only, covers api/
├── package.json · .nvmrc · .env.example · .gitignore
└── .github/workflows/ci.yml   # typecheck, validate:content, test:unit, build
```

> Update this tree whenever directories or top-level files change.

**Intentionally absent (do not list as implemented):** `assets-src/`,
`TileMap` grid parser, `TruNorthProject/`, `tests/e2e`, red-team trees, JSON Schema pack
under `content/schema/`, `public/sw.js`. (`api/` now exists — see above — as of the Vercel
adapter added 2026-07-17.)

---

## 3. Implemented components

> Inline entries stay short; deep walkthroughs live in `docs/context/` (Section 4).

### 3.0 Configuration (`src/config/`, `server/config.ts`, `.env.example`)
✅ Implemented. Runtime tunables via `.env` / `VITE_*`:
- `src/config/app.ts` — `appConfig` (apiUrl, feature flags incl. `worldMovement`, gameplay
  defaults Flicker/ch2/w1, timing, world-movement tunables), `isDemoMode()`.
- `src/config/content.ts` — `contentConfig`: zone metadata (`ZoneConfig[]`), achievement
  checklist, celebration copy. Note: the "bridge" zone and celebration reuse `forest.png`.
- `src/config/gameState.ts` — `createInitialGameState(demoMode)` from `appConfig.defaults`.
- `server/config.ts` — dependency-free `.env` loader + `serverConfig`
  (port/CORS/JWT/db path/companion model+floor+timeout).

### 3.1 Application entry (`src/main.ts`)
✅ Implemented. Detects demo mode (`?demo` / `VITE_DEMO_MODE`), wires
`LocalProgressStore` vs `DemoProgressStore` and Live vs Demo companion clients, navigates
landing → trust → onboarding → hub → **check-in** → game, starts `SceneEngine`,
celebration → parent gate → journey reflection. The `checkin` screen (between hub card
select and `startScenario`) stores its `CheckinRecord` in `progress.checkins[chapterId]`
and raises `flags.lastSafetyFlag` on a flagged typed answer. Attaches/detaches `worldRuntime` per screen; `beginEncounter`
freezes movement on trigger interact; collect pickups award crystals + persist. Together
Mode co-play step machine. Registers `/sw.js` in prod builds — **file doesn't exist**, so
registration silently no-ops.

### 3.2 Scene engine (`src/engine/SceneEngine.ts`, `DecisionResolver.ts`)
✅ Implemented — **click/trigger DOM scenes** (not tile-walking). Lifecycle detail:
[engine-runtime.md](./docs/context/engine-runtime.md).

- `SceneEngine` — loadScene (narration auto-advance; skipped when the scene has a
  finish/advance stage object), startDecision/triggerEncounter,
  submitChoice/submitTyped, multi-tap progress (`MULTI_TAP_REQUIRED`: dp_breathe ×5,
  dp_crossing ×4), repair loops, chapter-complete → celebration, companion + counselor
  callbacks, input freeze during companion calls. Public finish-object paths:
  `advanceScene(targetSceneId?)` and idempotent `completeChapter()` → celebration
  (see [world-stage-objects.md](./docs/context/world-stage-objects.md)).
- `DecisionResolver` — `resolveChoice` (option → band), `applyConsequence` (meter
  fill/level-ups, brownie points, 200-entry event log, repairAction, next scene).
  Also exports `canUsePlayfulExternalization` (unused by callers).

### 3.3 World movement (`src/engine/WorldRuntime.ts`, `Collision.ts`, `src/input/InputController.ts`)
✅ Implemented (DOM stage free-roam, not a tile grid) — see
[world-movement.md](./docs/context/world-movement.md).
- `worldRuntime` singleton — rAF loop, avatar movement with axis-separated AABB collision
  vs NPC feet boxes (default 70×42, per-character `solidSize` override — ch2 Flicker uses
  190×80 to seal the bridge) + walk bounds, companion lag-follow, collectible pickup,
  proximity interact (E/Space/Enter) with hints; feature-flagged `VITE_FEATURE_WORLD_MOVEMENT`.
  Proximity targets are a union: trigger zones → **stage objects** → NPC fallback
  (`onObjectInteract` callback) — see
  [world-stage-objects.md](./docs/context/world-stage-objects.md).
- `Collision.ts` — pure AABB helpers, `moveWithCollision` (wall sliding), walk bands.
- `InputController` — WASD/arrows hold-polling, one-shot interact; clickable trigger
  hotspots remain as fallback.
- **Grid levels** (`GridMap.ts`, `src/content/gridLevels.ts`,
  `src/render/gridBackground.ts`) — parameterized 100×100 cell grid (flat vector:
  coordinate + color + walkable per cell), painted-level builders (2 levels:
  `everbright-meadow` ← ch1, `singing-bridge` ← ch2), canvas background + hub
  thumbnails (`createGridThumbnail`), center-point collision in `WorldRuntime`.
  **Every scene JSON sets `gridMapId`** — grids are the levels now; URL `?grid=<id>`
  (+`&gridDebug=1`) still overrides for testing. See
  [world-grid-levels.md](./docs/context/world-grid-levels.md).
⬜ Not in repo: `SceneGraph`, `EmotionalResidue` modules.

### 3.4 Rendering (`src/render/characters.ts`)
🟨 Partial — inline SVG cast in **8-bit pixel-art style** (ASCII pixel maps →
`<rect>` grids with `shape-rendering="crispEdges"`), no separate sprite/manifest pipeline.
- `renderFullBodyCharacter(opts)` — avatar (skin-tone aware), **Flicker** (red Guardian
  Dragon; id/assetRef containing "flicker" resolves to the dragon, used for the ch2
  bridge-blocker NPC), **Wize** owl mentor, fox/sprite companion archetypes, helper
  animals, worry cloud, grown-up, NPCs; `ExpressionKey` mapping from scene `expression`
  strings.
  Expressions rendered as pixel overlays (eyes/brows/mouth, worry sparks, happy sparkles).
⬜ Not in repo: Viewport layers, SceneRenderer, BubbleManager, ParticleSystem as separate
modules (bubbles/HUD live in `GameView` + CSS).

### 3.5 UI & parent surfaces (`src/ui/`)
✅ Implemented — see [ui-screens-views.md](./docs/context/ui-screens-views.md).
- `GameView.ts` — `renderGameView` (stage, HUD meters, characters, triggers, collectibles,
  **stage objects** (emoji sprites, click fallback) + **`renderDialogOverlay`**
  (multi-page speaker dialog — see
  [world-stage-objects.md](./docs/context/world-stage-objects.md)),
  counselor panel (draggable via its header handle, ✕ to dismiss; position + dismissal
  survive re-renders, a dismissed insight returns when a new one arrives),
  decision overlay with Together Mode 2-step flow
  (narration bar removed 2026-07-18 — `scene.narration` is no longer displayed;
  stage-object dialogs carry story text; engine auto-advance timing unchanged);
  **stage z-layering** so no dialogue is ever blocked by a character:
  characters ≤ ~64 < counselor panel 70 < speaking character + bubble / interact hint 75
  < thinking pill 80 < modal overlays 100;
  **everything on the stage scales with viewport size** — the stage is a CSS size
  container exposing `--px` = 1 design px, characters set `--char-size` and their SVGs
  fill it, text uses `clamp()` legibility floors),
  `renderCelebration` (Courage Feather), `renderJourneyReflection`, `renderParentGate`
  (4-digit PIN, SHA-256 hash in localStorage, 3-fail lockout), `renderTrustScreen`.
- `screens.ts` — `renderLanding`, `renderAuthForm` (parent login/register),
  `renderOnboarding` (archetype/name/avatar; default **Flicker**), `renderScenarioHub`
  (child cards use grid canvas thumbnails when the start scene binds a grid; PNG fallback),
  `renderCheckin` (pre-level check-in cards + compass result; skippable — see
  [ui-screens-views.md](./docs/context/ui-screens-views.md)).
  Known issue: its local `Screen` type includes `"dashboard"`, which `main.ts` rejects
  (typecheck error).
- `auth.ts` — session token helpers (`getToken`/`setSession`/`clearSession`),
  `apiLogin`/`apiRegister`, `hashPin`/`verifyPin` (WebCrypto SHA-256).
- Together Mode discuss prompts: `counselor/coPlay.ts`.

### 3.6 AI companion client (`src/companion/CompanionClient.ts`)
✅ Implemented — see [safety-companion-pipeline.md](./docs/context/safety-companion-pipeline.md).
- `LiveCompanionClient` — POST `{API}/api/companion` with optional bearer token.
- `DemoCompanionClient` — offline bundle lookup `{scene}:{dp}:{band}` + keyword band
  inference for typed lines; always attaches counselor insight tips.

### 3.7 Safety (`src/safety/filters.ts`)
✅ Implemented. `filterInput` (jailbreak/distress/PII/profanity/length),
`filterOutput` (clinical/meetup blocklist), `sanitizeChildInput`, `escapeHtml`.
Used by unit tests and the server companion route.

### 3.8 Progress store (`src/store/ProgressStore.ts`)
✅ Implemented (MVP).
- `LocalProgressStore` — `trunorth_save_v1` in localStorage (load/save/clear/appendEvent).
- `DemoProgressStore` — in-memory.
- ⬜ Client `RemoteProgressStore` not built — note the **server** already exposes
  `GET/PUT /api/progress/:childId` (§3.11); nothing in the client calls it yet.

### 3.9 Counselor layer (`src/counselor/`)
✅ Implemented.
- `insights.ts` — `insightForStep(dpId, band)` (hand-written coaching for **all 10 DPs**
  × 3 bands + generic fallback; 2 are legacy ch3 DPs kept as library data),
  `buildJourneyReflection(state)` (summary, strengths, growth edges, per-step insights,
  parent coaching), `childFacingLine`.
- `coPlay.ts` — `discussPrompt(dpId)` Together-Mode conversation starters (all 10 DPs).
- `checkin.ts` — pre-level check-in: `CHECKIN_QUESTIONS` bank (6 open-ended questions,
  tappable 0–2-pt options + own-words path), `questionsForChapter` (3 per chapter,
  deterministic rotation), `scoreTypedCheckinAnswer` (sanitize + `filterInput` + feeling-word
  heuristic; distress → 0 pts + flag), `buildCheckinResult` (0–10 starting point,
  bright/steady/gentle placement; answer text never stored), placement labels/companion
  lines. `buildJourneyReflection` appends the baseline to its summary + parent coaching.

### 3.10 Shared types (`src/types/index.ts`)
✅ Implemented. GameState, Scene (`SceneCharacter` has optional `solidSize` [w, h]
collision-footprint override), DecisionPoint, companion request/response, ScenarioMeta,
PlayMode, ProgressStore interface, AuthUser/ChildProfile, `CheckinRecord`/`CheckinPlacement`
(+ optional `progress.checkins` map), **`StageObject`/`StageObjectInteraction`
(discriminated union: openDialog | finish) + `DialogRecord`/`DialogPage` + optional
`Scene.objects`**, factories
`createDefaultMeters` (7 skills). Defaults: companion **Flicker**, chapter `ch2`, scene `w1`.

### 3.11 Server API (`server/`)
✅ Implemented locally (not yet hosted) — full endpoint walkthrough:
[server-api.md](./docs/context/server-api.md). Companion pipeline detail:
[safety-companion-pipeline.md](./docs/context/safety-companion-pipeline.md).

> 🔧 **Jose** — production hosting for this Hono server + static client.
- `api/[[...route]].ts` — Vercel Node.js Function (`export const runtime = "nodejs"`,
  required so `better-sqlite3` works) using `hono/vercel`'s `handle(app)` to forward every
  `/api/*` path to the unchanged Hono `app`; catch-all filename so one function serves all
  routes. **Requires `DATABASE_PATH=/tmp/trunorth.db`** (or similar) as a Vercel env var —
  the project filesystem is read-only outside `/tmp`, so the default `./data/trunorth.db`
  would crash every cold start (`db/migrate.ts` opens the file at module load). This makes
  parent-auth/children/progress non-persistent across cold starts on Vercel, which is
  currently fine because the client doesn't call those endpoints yet (§3.8); wiring real
  persistence needs a serverless-compatible DB swap (Vercel Postgres/Neon or Turso
  libSQL), a separate task from this adapter.
- `index.ts` — `GET /api/health`; **parent auth** `register`/`login`/`me` (bcrypt + JWT);
  **child profiles** `GET/POST /api/children`; **remote progress** `GET/PUT
  /api/progress/:childId` (parent-owned, upsert; no client caller yet); audit-log writes;
  CORS from config.
- `routes/companion.ts` — `POST /api/companion`: input filter → Anthropic (if key) or
  local heuristic score → confidence floor → output filter → fallbacks library;
  `POST /api/reflect`: event list → counselor insights (no client caller yet).
- `auth/jwt.ts` — `signToken`/`verifyToken` (jose HS256, 7-day expiry).
- `db/migrate.ts` — SQLite schema: parents, child_profiles, progress, audit_logs (WAL).
- ⬜ No Vercel `api/` tree in this repo.

### 3.12 Content (`content/`)
✅ Implemented (draft; SME review still pending). Every scene sets `gridMapId`, so both
levels play on grid backgrounds (§3.3); hub shows only these two + parent coach.
Scenes may declare **stage objects** (`objects[]`: grid-cell interactables → dialog or
finish line) and **dialogs** (`dlg_*.json`, registered in `DIALOGS`): ch1 has a welcome
signpost (e1), a North Gate finish/advance (e2 — replaces its auto-advance timer), and a
Celebration Arch finish/complete (e3, alternate to `dp_ask_grownup`); ch2 has Wize's
bridge-legend scroll (w1) and the ✅ Level Complete finish (w7). Authoring guide:
[world-stage-objects.md](./docs/context/world-stage-objects.md).
- **Ch.2 The Singing Bridge (golden path, grid `singing-bridge`):** Wize the owl is the
  follower companion; Flicker the dragon stands at the bridge with a widened `solidSize`
  solid, physically blocking the only river crossing through w1–w6.
  w1 quest → w2 investigate → w3 fact/story → w4 breathe (5 taps) → w5 choose →
  w6 crossing (4 taps) → w7 Flicker steps aside, player walks the bridge to the ✅
  finish/complete checkmark → Courage Feather celebration. DPs: `dp_quest_start`,
  `dp_investigate`, `dp_fact_sort`, `dp_breathe`, `dp_choose_path`, `dp_crossing`
  (no longer a chapter-complete decision — `CHAPTER_COMPLETE_DECISION` is ch1-only).
- **Ch.1 Everbright Meadow (grid `everbright-meadow`):** e1–e3, 2 DPs.
- **Ch.3 Forest removed 2026-07-17** (files deleted, registry/scenario/hub entries
  dropped). Its 2 DPs remain only as library data in insights/coPlay/fallbacks.
- `fallbacks/companion-fallbacks.json` — 10 DPs × strong/partial/poor/timeout/safety
  (8 registered + 2 legacy ch3).
- `demo/showcase.bundle.json` — 10 canned responses keyed `{scene}:{dp}:{band}`.
- ⬜ `content/schema/` Ajv pack, `content/rubrics/` — not present.
- ⬜ Per-scene `tileMap` rooms — not used (scenes use `gridMapId` + `triggers`).

### 3.13 Assets (`public/assets/`)
🟨 Partial. Zone PNGs (meadow/forest/cave/mountain) under `public/assets/zones/`;
characters are code-drawn 8-bit pixel SVG (see §3.4); `favicon.svg` is a matching
8-bit compass star. The Singing Bridge zone + celebration reuse `forest.png`
(no bridge art yet). No `assets-src/` provenance pipeline.

> 🔧 **Ermoni & Gabby** — Level 1 art + Supabase delivery (offline fallback required).

### 3.14 Build & tooling
🟨 Partial.
- `scripts/validate-content.ts` — walks chapter JSON for id/chapterId/emotionalArc/
  consequences, plus dialog files (`dlg_*`: id/chapterId/non-empty pages) and scene
  `objects[]` (unique ids, 0–99 cells, resolvable dialog/finish targets) — two-pass,
  still no Ajv schemas. **Passing** as of 2026-07-17.
- `npm run test:unit` — **37/37 passing**. `npm run build` — **passing** (vite build;
  server tsc errors are swallowed by `|| true`).
- **`npm run typecheck` — FAILING (9 errors), which makes CI red:**
  8 × TS2352 in `src/content/index.ts` (scene JSON `position: number[]` doesn't satisfy
  `[number, number]` for the `as Scene` casts; was 10 before ch3 removal) and 1 × TS2345
  in `src/main.ts` (`screens.ts` `Screen` includes `"dashboard"`, not in `AppScreen`).
  Script is now `tsc --noEmit && tsc -p tsconfig.api.json` — the second pass covers both
  `server/` and the new `api/` (see below) via **`tsconfig.api.json`** (`noEmit: true`,
  extends `tsconfig.server.json`); a separate config was needed because adding `api/` to
  `tsconfig.server.json` itself trips `TS6059` (`api/[[...route]].ts` sits outside its
  `rootDir: "server"`) whenever something actually emits — `noEmit: true` sidesteps that,
  and `tsconfig.server.json` (used by the Docker build's `--noEmit false` pass) is
  untouched.
- `npm run lint` — broken: no `eslint.config.js` (flat config) for ESLint v9; the
  `api/` directory it targets now exists (2026-07-17) but the missing config file is the
  actual blocker.
- **Known quirk (left as-is on purpose):** the server pass of `npm run build`
  (`tsc -p tsconfig.server.json --noEmit false`) emits stray `.js` files **into `src/`**
  for client files the server imports (`src/types/index.js`, `src/safety/filters.js`,
  `src/counselor/{insights,checkin}.js`) because `rootDir: "server"` puts them outside
  `dist-server`. These strays silently **shadow the `.ts` sources** in vitest and vite
  (all imports use `.js` extensions) — if tests/dev ignore your edits after a build,
  delete `src/**/*.js` strays. **Never commit them.** This whole build path is interim
  and will be replaced when the proper hosted API/backend build lands (Jose's deploy
  task) — don't invest in fixing it.
- CI (`.github/workflows/ci.yml`): typecheck → validate:content → test:unit → build.
- ⬜ `build-asset-manifest`, `red-team-suite`, `audit-bundle-size` — not in tree.
- ⬜ Playwright e2e — `test:e2e` script + devDependency exist; **no `tests/e2e` folder or
  playwright config**.

### 3.15 Tests (`tests/`)
🟨 Partial — **37 tests, all passing**: `tests/unit/engine.test.ts` (13 — DecisionResolver
bands/meters/repair, safety filters, Singing Bridge golden-path presence, ch3 absence,
counselor insights + journey reflection, SVG cast rendering, world collision wall slide +
bounds) + `tests/unit/grid.test.ts` (8 — grid cell vector, painting/world lookup,
center-point slide, level registry, `?grid=` resolution, scenario/scene→grid routing,
bridge-only river crossing, Flicker-solid bridge block w6 vs clear w7) +
`tests/unit/checkin.test.ts` (6 — question rotation, typed
feeling-word scoring, distress flag, placement bands, labels/lines, reflection baseline)
+ `tests/unit/stageObjects.test.ts` (10 — cell→world parity, object placement/sprites,
object/dialog content integrity incl. ch2 w7-checkmark completion,
advanceScene/completeChapter, auto-advance suppression).
⬜ integration / e2e / red-team folders.

---

## 4. Context files index (`docs/context/`)

| Context file | Documents | Summary |
|---|---|---|
| [engine-runtime.md](./docs/context/engine-runtime.md) | `src/engine/SceneEngine.ts`, `DecisionResolver.ts`, `src/main.ts`, `src/ui/GameView.ts`, `src/content/index.ts` | Boot screens, scene phases, multi-tap + repair + celebration flow |
| [world-movement.md](./docs/context/world-movement.md) | `src/engine/WorldRuntime.ts`, `src/engine/Collision.ts`, `src/input/InputController.ts` | Free-roam runtime: rAF loop, AABB collision, follow, collectibles, interact |
| [world-grid-levels.md](./docs/context/world-grid-levels.md) | `src/engine/GridMap.ts`, `src/content/gridLevels.ts`, `src/render/gridBackground.ts` | 100×100 grid levels: cell vector, painting API, canvas bg, center-point collision, `?grid=` testing |
| [world-stage-objects.md](./docs/context/world-stage-objects.md) | `StageObject`/`DialogRecord` types, `src/content/stageObjects.ts`, `DIALOGS`, WorldRuntime object proximity, `renderDialogOverlay`, SceneEngine finish methods, `main.ts` dispatch | Declarative stage objects: grid-cell interactables → multi-page dialogs + finish lines (advance/complete); authoring guide |
| [ui-screens-views.md](./docs/context/ui-screens-views.md) | `src/ui/GameView.ts`, `src/ui/screens.ts`, `src/ui/auth.ts` | Every render function: game view, overlays, onboarding, hub, parent gate, auth |
| [server-api.md](./docs/context/server-api.md) | `server/*` (index, main, config, auth, db, routes) | All HTTP endpoints, SQLite schema, JWT, companion pipeline steps |
| [safety-companion-pipeline.md](./docs/context/safety-companion-pipeline.md) | `server/routes/companion.ts`, `src/companion/*`, `src/safety/*`, fallbacks | Live vs demo companion paths, filters, fallback coverage |

---

## 5. Open gaps (feeds the task board)

| Gap | Owner hint | Status |
|---|---|---|
| Fix `npm run typecheck` (11 errors) → CI green | Daniel | ⬜ **CI currently red** |
| Level 1 / zone production art + Supabase | Ermoni + Gabby | ⬜ |
| Hosted deploy (client + Hono API) | Jose | 🟨 Vercel Node Function adapter (`api/[[...route]].ts`) added 2026-07-17; actual Vercel project/env vars/deploy still pending |
| Wire client to server remote-progress endpoints | (unassigned) | ⬜ server side done |
| GoZen!-informed vision for Levels 2+ | Vandy | 🟨 script L1 done; research open |
| Level 1 playtest criteria | Ranya | ⬜ |
| PR/spec shepherding | Madhu | ongoing |
| E2E golden path W1→W7 | (unassigned) | ⬜ |
| JSON Schema validate-content | (unassigned) | ⬜ |
| `npm run lint` fix (drops phantom `api/` dir) | (unassigned) | ⬜ |
| TileMap / WASD architecture | — | ✅ free-roam WASD + 100×100 grid levels; all scenes bind `gridMapId` |

---

## 6. Recent changelog (ledger)

| Date | Change |
|---|---|
| 2026-07-13 | Rebased this ledger onto real `trunorth/` tree (removed phantom `TruNorthProject/` claims). |
| 2026-07-13 | Integrated Level 1 **The Singing Bridge** (W1–W6, Flicker, Wize, Courage Feather). |
| 2026-07-13 | Updated team board: Daniel L1 done; Ermoni/Gabby/Jose/Vandy/Ranya tasks retargeted. |
| 2026-07-13 | Organized repo into `docs/{specs,scripts,kickoff,context}`; added configurable `server/config.ts`, `src/config/*`, expanded `.env.example`. |
| 2026-07-14 | Added world movement: WASD/arrows, collision, proximity interact (E/Space), companion follow, collectible pickup (`WorldRuntime`). |
| 2026-07-17 | Full reality audit: documented server auth/children/progress/reflect endpoints, world movement promoted to ✅, test count 11→13, recorded failing typecheck (CI red), broken lint script, missing `sw.js`; added context files `world-movement.md`, `ui-screens-views.md`, `server-api.md`. |
| 2026-07-17 | Added parameterized 100×100 grid levels: `GridMap` (cell vector: coordinate/color/walkable, painting API), `gridLevels.ts` (2 demo levels, `?grid=<id>` testing), canvas `gridBackground.ts`, center-point grid collision in `WorldRuntime`, optional `Scene.gridMapId`; tests 13→19; context file `world-grid-levels.md`. |
| 2026-07-17 | Made grid levels the only levels: all ch1/ch2 scenes bind `gridMapId` (everbright-meadow / singing-bridge), hub cards render grid canvas thumbnails, ch1 scenario retitled "Everbright Meadow"; **removed ch3 Forest** (content files + registry + hub card + default unlock); tests 19→20; typecheck errors 11→9. |
| 2026-07-17 | Added **pre-level check-in**: hub → `checkin` screen before every level (3 open-ended questions from a 6-question bank, tap or own-words answers, safety-filtered) → 0–10 starting point + bright/steady/gentle placement stored in `progress.checkins`, shown on a compass scale, and surfaced in the parent journey reflection. New `src/counselor/checkin.ts`, `renderCheckin`; tests 20→26. **Deleted committed stale compiled JS (`src/counselor/insights.js`, `src/safety/filters.js`, `src/types/index.js`)** — they silently shadowed the `.ts` sources in vitest and vite builds. Root cause: the server build pass emits into `src/` (documented as a known quirk in §3.14; left as-is until the proper hosted API/backend build replaces it). |
| 2026-07-17 | Added Vercel deploy scaffolding: `api/[[...route]].ts` (Node Function wrapping the existing Hono `app` via `hono/vercel`'s `handle()`, catch-all so one function serves every `/api/*` route) + `tsconfig.api.json` (typecheck-only config covering `server/`+`api/` without disturbing the Docker build's `tsconfig.server.json`); `npm run typecheck`'s second pass now uses it. Code-side only — the actual Vercel project (root dir, env vars incl. `DATABASE_PATH=/tmp/...`, deploy) is still a manual step for whoever holds the Vercel account. |
| 2026-07-17 | Recreated the full character cast (`src/render/characters.ts`) + `public/favicon.svg` in 8-bit pixel-art style: ASCII pixel maps rendered as crisp SVG `<rect>` grids, pixel expression overlays (brows/mouth/sparks/sparkles). Same exports, sizes, and aspect ratios — no caller changes. |
| 2026-07-17 | Made the whole game stage scale with the screen (characters were fixed 110/120px while the stage shrank): `.game-viewport` is now a CSS size container defining `--px` (1/1920 of stage width); characters get a `--char-size` var in `GameView` and their SVGs fill it (`width:100%; height:auto`); labels, speech bubbles, collectibles, move/interact hints, HUD meters, pills, zone sign, narration bar all sized in `calc(n * var(--px))` with `clamp()` legibility floors on text. Verified at 1600/700/480px windows — avatar:stage ratio constant 0.0573. `src/styles/global.css` + `src/ui/GameView.ts` only. |
| 2026-07-18 | Made the SEL Coach insight panel draggable + closable (`GameView.ts` + `global.css` only): new `.counselor-panel-header` (badge + ✕) acts as a pointer-capture drag handle with window-clamped inline `left/top`; ✕ dismisses. Module-scope state keeps the dragged position and the dismissed-insight key across the full re-renders `renderGameView` does each phase/meter update — a dismissed insight stays hidden until a different insight arrives. |
| 2026-07-18 | Fixed dialogs being blocked by characters + removed the bottom narration bar (`GameView.ts` + `global.css` only): characters (z up to ~64 from `10 + y/20`) were punching through the decision/dialog `.overlay` (was z 30) and standing on the counselor panel (was z 25). New stage z-layering: counselor panel 70, speaking character + bubble / interact hint 75, thinking pill 80, modal overlays 100. Companion speech bubble restyled (wider `360*--px` max, border, tail, 11px floor). Narration bar deleted — `scene.narration` no longer renders (stage-object dialogs carry story text; `SceneEngine` auto-advance untouched). Also de-overlapped top pills: stage tag drops below the demo pill, together-pill below the crystal counter; move hint moved to bottom-left. Verified in-browser (w1→w3 + scroll dialog); 36/36 tests, typecheck still 9 known errors. |
| 2026-07-17 | Added **declarative stage objects** (groundwork for the anxiety level & infinite stage authoring): `Scene.objects[]` — grid-cell-placed interactables with a `StageObjectInteraction` union (`openDialog` → new multi-page `renderDialogOverlay` with speaker/portrait, fed by `dlg_*.json` + `DIALOGS` registry; `finish` → new public `SceneEngine.advanceScene`/`completeChapter`, with `advance`\|`complete` per object). WorldRuntime proximity now targets triggers → objects → NPC fallback (`onObjectInteract`); objects render as emoji sprites with click fallback; narration auto-advance is skipped when a finish/advance object exists. Demo content: ch1 signpost/North Gate/Celebration Arch, ch2 w1 Wize scroll (ch2 finale untouched). validate-content now checks dialogs + objects; tests 26→36. Verified in-browser (dialog paging/freeze, gate advance, arch celebration, no auto-advance). New context file `world-stage-objects.md`. |
| 2026-07-18 | Removed Flicker's detached orange wing pixels (`O: #ff9e00`) from `dragonSvg` in `src/render/characters.ts` — the floating triangles read as a stray orange mouse cursor next to the companion in-game; body/belly widened one column to fill the gap. Art-only, no export changes. |
| 2026-07-18 | **Fixed the Wize/Flicker role swap in Level 1 + walk-to-finish ending.** Ch2 scenes now cast **Wize the owl as the follower companion** (assetRef `char_wize` on the `companion` id; GameView labels/pill say "Wize" whenever the scene's companion assetRef is wize) and **Flicker the dragon as a stationary NPC blocking the Singing Bridge** (new `flicker` id → dragon sprite mapping in `characters.ts`; new optional `SceneCharacter.solidSize` [w,h] lets his solid span the whole 154px plank corridor, 190×80 at the south entrance in w1–w6). Chapter completion is no longer decision-driven: `dp_crossing` strong now advances to **new scene w7**, where Flicker stands aside and a ✅ "Level Complete" `finish/complete` stage object sits on the north bank — the player physically crosses the bridge and presses E to end the level (ch2 removed from `CHAPTER_COMPLETE_DECISION`; `GOLDEN_PATH`/`CHAPTER_FINALE` updated; new `finish_check` sprite). Script text unchanged. Tests 36→37 (bridge-block collision test; ch2 finale guard rewritten for w7); verified end-to-end in headless Chromium (blocked at bridge in w1, full W1→W7 play-through, checkmark → Courage Feather celebration). |
