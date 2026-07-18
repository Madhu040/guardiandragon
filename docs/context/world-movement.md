# World movement (exploration runtime)

**Sources:** `trunorth/src/engine/WorldRuntime.ts`, `trunorth/src/engine/Collision.ts`,
`trunorth/src/input/InputController.ts`

Free-roam movement layered on the DOM scene stage. Feature-flagged by
`VITE_FEATURE_WORLD_MOVEMENT` (default on); tunables in `appConfig.world`
(`moveSpeedPx` 420, `interactRadiusPx` 140, `companionFollowLag` 0.88).

Scenes can alternatively use a **100×100 grid background with per-cell walkability**
— when a grid level resolves for the scene, `WorldRuntime` spawns the avatar at the
level's spawn cell and switches `stepMovement` to center-point grid collision. See
[world-grid-levels.md](./world-grid-levels.md).

## `InputController.ts`

- `attach()` / `detach()` — window keydown/keyup listeners; ignores keys typed into
  inputs/textareas/contenteditable.
- `setEnabled(bool)` — clears pressed state when disabled (used by freeze).
- `getMoveVector()` — WASD/arrows held-key polling, diagonal normalized by 1/√2.
- `getFacing(fallback)` — dominant-axis facing from the move vector.
- `consumeInteract()` — one-shot E / Space / Enter press.
- `type Facing = up|down|left|right`.

## `Collision.ts`

Pure AABB helpers in 1920×1080 scene space (`WORLD_W`/`WORLD_H`):

- `pointInAabb`, `aabbOverlap`, `aabbCenter`, `distance`, `expandAabb` — geometry primitives.
- `characterFeetBox(cx, cy, w=56, h=36)` — feet-anchored collision box for a standing character.
- `moveWithCollision(pos, delta, footprint, solids, bounds)` — axis-separated move: X then Y,
  each axis rejected independently on solid overlap or leaving bounds, so the avatar slides
  along walls. Covered by two unit tests.
- `defaultWalkBounds()` — soft ground band (lower ~55% of the scene, inset edges).

## `WorldRuntime.ts` (singleton `worldRuntime`)

- `attach(viewport, scene, exploring, callbacks)` — no-op detach if the feature flag is off.
  On scene change: seeds avatar/companion positions from scene `characters`
  (`seedFromScene`), rebuilds NPC solids (`rebuildSolids` — feet boxes for everything except
  avatar/companion/worry_cloud, default 70×42 px or the character's `solidSize` [w, h]
  override — e.g. ch2's Flicker uses 190×80 to seal the whole bridge walkway; bridge
  scenes get a narrower river-bank walk band), clears
  collected set. Starts one `requestAnimationFrame` loop and re-syncs DOM on every re-render
  (GameView rebuilds the DOM, so positions/hints are re-applied).
- `detach()` — cancels rAF, detaches input, removes hint elements. Called by `main.ts`
  `navigate()` whenever leaving the game screen.
- `freeze(frozen)` — pauses simulation and input (used while the decision overlay is open).
- `tick(ts)` (private, rAF) — dt-clamped: `stepMovement` (input vector × speed through
  `moveWithCollision`), `followCompanion` (exponential-lag follow offset by facing),
  `checkCollectibles` (feet-box overlap → `onCollect(id)` + `.collected` class),
  `updateProximity` (priority: trigger zones → **stage objects** (nearest within radius)
  → near-NPC fallback to the scene's first trigger; `nearTarget` is a
  `NearInteractable` union), then interact consumption → `onInteract(target)` for
  triggers or `onObjectInteract(objectId)` for objects. Stage objects (dialogs, finish
  lines) are documented in [world-stage-objects.md](./world-stage-objects.md).
- DOM sync: `applyDomPositions`/`placeEl` write %-based left/top + y-derived z-index and
  facing dataset; `sortDepth` re-appends characters by y; `renderHint` maintains
  "Press E to interact" + "Move: WASD…" hints and highlights the in-range trigger zone.
- `avatarStartFromScene(scene)` — exported seed helper (currently unused by app code).

## Integration (`main.ts` / `GameView`)

`renderGameView` calls back `onWorldReady(viewport, scene, exploring)` →
`worldRuntime.attach`. Interacting with a trigger runs `beginEncounter` → engine
`triggerEncounter` + `worldRuntime.freeze(true)`. Collect pickups award a crystal, record
into `progress.kindnessSparksFound[sceneId]`, save, and patch the counter in place.
