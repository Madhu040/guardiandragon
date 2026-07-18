# Engine runtime

**Sources:** `trunorth/src/main.ts`, `trunorth/src/engine/SceneEngine.ts`,
`trunorth/src/engine/DecisionResolver.ts`, `trunorth/src/ui/GameView.ts`,
`trunorth/src/content/index.ts`

## Boot / screens

1. Landing (guest play, together, demo, parent auth)
2. Trust screen → onboarding (companion archetype + name, avatar)
3. Scenario hub (`SCENARIOS`)
4. Pre-level check-in (`renderCheckin` + `src/counselor/checkin.ts`): 3 open-ended
   questions (tap an option or type; typed answers safety-filtered + keyword-scored)
   → 0–10 starting point + bright/steady/gentle placement stored in
   `progress.checkins[chapterId]`; skippable
5. `startScenario` builds store + companion client, constructs `SceneEngine`,
   `loadScene(startSceneId)`
6. On chapter-complete decision with strong band → celebration → parent gate →
   journey reflection (mentions the check-in baseline when one was recorded)

Demo mode: `?demo=1` or `VITE_DEMO_MODE=true` → `DemoProgressStore` +
`DemoCompanionClient` (zero network).

## Scene phases

`loading` → `exploring` → (`encounter`) → `decision` → `awaitingCompanion` →
`consequence` → (`transitioning` | celebration) | repair back to `decision`.

- Exploring: clickable `triggers` on the scene. (`scene.narration` is no longer
  displayed — the bottom narration bar was removed 2026-07-18; story text is carried
  by stage-object dialogs.)
- Decision: choice / typed overlay from `GameView`.
- Narration-only scenes (no DPs, has `nextSceneId`) still auto-advance after ~2.2s.

## Exploration movement

When `VITE_FEATURE_WORLD_MOVEMENT=true` (default):

- `InputController` — WASD/arrows hold-polling; E / Space / Enter interact
- `WorldRuntime` — rAF avatar motion in 1920×1080 scene space, companion follow,
  axis-separated collision vs NPC feet boxes + walk band, proximity to triggers,
  collectible pickup
- Decision UI freezes movement; clicking a dashed hotspot still works as fallback


`MULTI_TAP_REQUIRED` in `content/index.ts`:

| Decision | Taps | Progress lines |
|---|---|---|
| `dp_breathe` | 5 | Breath N… heart softens |
| `dp_crossing` | 4 | Plank N… bridge holds |

Intermediate taps emit partial insight and return early; final strong option
(or tap count met) continues into companion resolve + scene advance.

## Repair

If consequence includes `repairAction`, engine stays on the decision and shows a
contextual line (e.g. Singing Bridge “go back” keeps Wize’s agency invite).

## Level 1 path (golden)

`GOLDEN_PATH`: w1 → w2 → w3 → w4 → w5 → w6 → w7  
No finale decision for ch2: `dp_crossing` (strong) advances to w7, where Flicker steps
aside and the player physically walks the bridge to the ✅ finish/complete stage object
→ Courage Feather celebration. (ch1 still completes via `dp_ask_grownup` —
`CHAPTER_COMPLETE_DECISION`.)
