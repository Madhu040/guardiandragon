# DallasAITeam15 — TruNorth

Github channel for the TruNorth gaming platform.

## Layout

```
DallasAITeam15/
├── product.md              # Living ledger — what's built + team tasks
├── docs/
│   ├── specs/              # Technical specifications (intent)
│   ├── scripts/            # Narrative scripts (Level 1 Singing Bridge, …)
│   ├── kickoff/            # Team kickoff materials
│   └── context/            # Deep-dives linked from product.md
└── trunorth/               # Playable app (Vite client + Hono API)
```

**Living implementation ledger:** [`product.md`](product.md)  
**Documentation index:** [`docs/README.md`](docs/README.md)  
**App:** [`trunorth/README.md`](trunorth/README.md)

## Quick Start

```bash
cd trunorth
npm install
cp .env.example .env   # configure ports, AI key, defaults
npm run dev
```

| Service | URL (defaults) |
|---------|-----|
| Game | http://localhost:5173 |
| API | http://localhost:3001 |
| Demo (offline) | http://localhost:5173?demo=1 |

Configure everything via `trunorth/.env` (see `.env.example`). Client vars must be prefixed with `VITE_`.
