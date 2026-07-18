# Safety & companion pipeline

**Sources:** `trunorth/server/routes/companion.ts`, `trunorth/src/companion/CompanionClient.ts`,
`trunorth/src/safety/filters.ts`, `trunorth/content/fallbacks/companion-fallbacks.json`,
`trunorth/content/demo/showcase.bundle.json`, `trunorth/src/counselor/insights.ts`

## Live path (`LiveCompanionClient` → Hono)

1. **Input filter** (`filterInput`) — blocks jailbreak, distress, PII patterns, etc.
   On block: safety fallback line + redirect response.
2. **Model or local score** — if `ANTHROPIC_API_KEY` set, Claude call (~8s timeout);
   else `scoreLocally` heuristic + fallback library line.
3. **Confidence floor** (default 0.55) — low confidence → fallback band/line.
4. **Output filter** (`filterOutput`) — reject unsafe model text → substitute fallback.
5. Attach counselor `insightForStep` child/parent tips when available.

## Demo path (`DemoCompanionClient`)

- Lookup key: `{sceneId}:{decisionPointId}:{band}` in `showcase.bundle.json`.
- Band inferred from typed keywords when needed.
- Always attaches `insightForStep` tips; no network.

## Fallback library

`companion-fallbacks.json` keys by decision-point id with
`strong` / `partial` / `poor` / `timeout` / `safety` strings. Level 1 Singing Bridge
DPs are covered (`dp_quest_start` … `dp_crossing`) plus meadow/forest DPs.

## Client safety surface

All child-facing UI should render via `textContent` (GameView). Prefer
`filters.ts` as the TypeScript source of truth (do not maintain a parallel
hand-edited `.js` duplicate).
