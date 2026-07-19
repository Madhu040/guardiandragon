# TruNorth

**An SEL adventure for kids and a coaching companion for parents — built for families ages 5–15.**

TruNorth helps children practice empathy, courage, and calm through interactive story scenarios, while giving parents counselor-style insights and practical tips to reinforce those skills at home. Kids play; parents understand and guide — together.

### How kids benefit
- Interactive scenarios about friendship, worry, anger, and belonging
- Choices with supportive AI companion feedback after every step
- Skill meters for empathy, calm, and courage that grow with play
- A safe space with no open chat and no shame-based messaging

### How parents benefit
- Step-by-step SEL coach insights after each decision
- Parent Coach Corner with strengths, growth edges, and home practice tips
- PIN-protected reflections and progress tracking
- Parent accounts to manage child profiles and sync progress (optional)

Built per the [Consolidated TruNorth Technical Specification](../docs/specs/Consolidated%20TruNorth-Technical-Specification.md).

**Repo ledger:** keep [`../product.md`](../product.md) current on every PR that changes files or behavior.

## Configuration

Copy [`.env.example`](./.env.example) → `.env`. Highlights:

| Area | Module | Env keys |
|---|---|---|
| API port, CORS, JWT, DB | `server/config.ts` | `PORT`, `CORS_ORIGINS`, `JWT_SECRET`, `DATABASE_PATH` |
| Companion AI | `server/config.ts` | `ANTHROPIC_API_KEY`, `COMPANION_MODEL`, `CONFIDENCE_FLOOR` |
| Client API + demo | `src/config/app.ts` | `VITE_API_URL`, `VITE_DEMO_MODE` |
| Gameplay defaults | `src/config/app.ts` | `VITE_DEFAULT_COMPANION_NAME`, `VITE_DEFAULT_CHAPTER_ID`, … |
| Zones / celebration art | `src/config/content.ts` | (edit file — image paths & copy) |
| Vite ports / proxy | `vite.config.ts` | `VITE_DEV_PORT`, `VITE_API_PROXY_TARGET` |

Client-facing variables **must** start with `VITE_` so Vite exposes them to the browser.

## Features

- **Play Together invites** — shareable 4-letter code + link (`?invite=CODE`); rooms sync via API across devices
- **Custom scene engine** — no game engine; DOM + CSS scene-graph state machine
- **Showcase golden path** — Level 1 *The Little Dragon Who Wouldn't Stop Guarding* (W1→W7 with Nova, Flicker & Wize)
- **AI companion** — server-side Claude proxy with 5-layer safety pipeline
- **Demo mode** — fully offline, zero network (`?demo=1`)
- **Parent authentication** — JWT-based parent accounts (children never log in directly)
- **Parent gate** — PIN-protected chapter transitions
- **Trust screen** — COPPA-aware safety boundaries
- **Progress persistence** — localStorage (MVP) + remote sync via parent account (EXT)
- **PWA** — installable on desktop, tablet, and mobile
- **Docker** — containerized deployment for any platform

## Quick Start

### Prerequisites

- Node.js 20+ (22 recommended)
- npm 10+

### 1. Install dependencies

```bash
cd trunorth
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Optionally set ANTHROPIC_API_KEY for live AI companion
```

### 3. Run locally (development)

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Game (frontend) | http://localhost:5173 |
| API (backend) | http://localhost:3001 |

### 4. Play

- **Guest play:** Click "Play Now" on the landing page
- **Play Together (cross-device):** Click "Play Together" → host as parent or child → share the code/link → partner opens `?invite=CODE` on any device → both pick name, color, character → Let's play. Requires `npm run dev` (API on :3001). For phone + laptop on the same Wi‑Fi, open the game via your LAN IP (e.g. `http://192.168.x.x:5173`) so the invite link stays reachable.
- **Demo mode (offline):** http://localhost:5173?demo=1
- **Parent account:** Register/login to manage child profiles and sync progress

## Demo Mode (Offline Showcase)

```bash
npm run build
npm run preview
# Open http://localhost:4173?demo=1
```

No network requests. Canned companion responses. Preloaded assets.

## Docker Deployment

```bash
npm run build
docker compose up --build
```

| Service | URL |
|---------|-----|
| Game | http://localhost:8080 |
| API | http://localhost:3001 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + API concurrently |
| `npm run build` | Production build |
| `npm run demo` | Build + serve offline demo |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run validate:content` | Validate scene/decision JSON |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Initialize SQLite database |

## Architecture

```
Browser Client          API Server (Hono)
├── Scene Engine        ├── /api/companion (AI proxy + safety)
├── 16:9 Renderer       ├── /api/auth/* (parent JWT auth)
├── Demo/Live Client    ├── /api/children (child profiles)
├── LocalProgressStore  ├── /api/progress/:childId (remote sync)
└── Parent surfaces     └── SQLite database
```

## Security

- No API keys in the browser
- Parent-only authentication (children never authenticate directly)
- 5-layer AI safety pipeline (input filter → scoped prompt → model → schema validation → output filter)
- PIN-hashed parent gate with cooldown
- No raw child transcript logging
- JWT tokens with 7-day expiry

## Golden Path

```
W1 (quest) → W2 (Forest of Questions) → W3 (Meadow of Curiosity) → W4 (Valley of Welcome)
→ W5 (Cave of Purpose) → W6 (Mountain / Festival steps) → W7 (walk on stage + Star Crystal)
```

## License

Private — Dallas AI Summer 2026 Cohort
