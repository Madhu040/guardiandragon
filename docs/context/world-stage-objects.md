# Stage objects (interactable entities, dialogs, finish lines)

**Sources:** `trunorth/src/types/index.ts` (`StageObject`, `StageObjectInteraction`,
`DialogRecord`, `DialogPage`, `Scene.objects`), `trunorth/src/content/stageObjects.ts`,
`trunorth/src/content/index.ts` (`DIALOGS`/`getDialog`),
`trunorth/src/engine/GridMap.ts` (`gridCellToWorld`),
`trunorth/src/engine/WorldRuntime.ts` (object proximity),
`trunorth/src/engine/SceneEngine.ts` (`advanceScene`, `completeChapter`),
`trunorth/src/ui/GameView.ts` (object rendering + `renderDialogOverlay`),
`trunorth/src/main.ts` (`onStageObject` dispatch), `trunorth/scripts/validate-content.ts`

A **stage object** is a declarative, interactable entity placed on a level at a grid
cell. The player walks near it (hint "Press E …" appears via the existing proximity
system), presses E/Space/Enter — or clicks/taps it directly — and the object's
`interaction` fires. Everything is content-driven: adding stages, objects, and dialogs
is JSON authoring plus at most one registry line; no engine changes.

## Data model (`src/types/index.ts`)

```jsonc
// inside a *.scene.json
"objects": [
  {
    "id": "obj_meadow_gate",
    "cell": [42, 7],              // grid cell [col,row] of the 100×100 level grid
    "assetRef": "finish_flag",    // key into OBJECT_SPRITES (emoji map)
    "label": "North Gate",        // optional caption under the sprite
    "hint": "Press E to continue",// optional custom proximity hint
    "interaction": { "kind": "finish", "mode": "advance" }
  }
]
```

`StageObjectInteraction` is a discriminated union — the extensibility point:

- `{ kind: "openDialog", dialogId }` — opens the dialog with that id (see below).
- `{ kind: "finish", mode: "advance" | "complete", targetSceneId? }` —
  `advance` jumps to `targetSceneId` (falls back to the scene's `nextSceneId`);
  `complete` finishes the whole chapter → celebration screen.

**Adding a new kind:** extend the union in `types/index.ts`, handle it in the
exhaustive `switch` in `main.ts` `onStageObject` (a `never` check fails typecheck if a
kind is unhandled), and teach `scripts/validate-content.ts` its shape.

**Coordinates are grid cells**, matching how levels are painted
(`src/content/gridLevels.ts`), unlike the legacy px-based `characters`/`triggers`
fields. `gridCellToWorld(col, row)` in `GridMap.ts` converts cell → world px
(1920×1080) as a pure function; `objectWorldPos(obj)` in `stageObjects.ts` wraps it.

## Dialogs

- Authored as standalone `content/chapters/<ch>/dlg_*.json` files
  (`DialogRecord`): `id`, `chapterId`, optional `speaker` +
  `speakerAssetRef` (portrait via `renderFullBodyCharacter`), and `pages[]`
  (`{ text, speaker? }` — page-level speaker overrides the dialog's).
- Registered in `DIALOGS` in `src/content/index.ts`; looked up with `getDialog(id)`.
- Rendered by `renderDialogOverlay` (`GameView.ts`): modal `.overlay` +
  `.dialog-panel` with speaker badge/portrait, page text, page counter, Next/Done
  button, ✕ close; read aloud once per page via `speakOverlayOnce`.
- Dialog state (`{ id, page }`) lives in `main.ts` (`activeDialog`), not the engine —
  the engine phase stays `"exploring"`. Opening freezes `worldRuntime`; closing
  unfreezes and re-renders **on a 0-ms timeout** so the closing click finishes on the
  old DOM (otherwise the browser retargets it onto whatever renders under the cursor,
  e.g. a trigger zone — observed in browser testing).

## Runtime flow

1. `WorldRuntime.updateProximity()` picks the near target in priority order:
   **trigger zones → stage objects (nearest within `interactRadiusPx`) → NPC
   fallback**. `nearTarget` is now a union (`NearInteractable`):
   `{type:"trigger"}` or `{type:"object", objectId, hint?}`.
2. On E/Space/Enter, triggers still call `onInteract(target)` (decision flow,
   unchanged); objects call the new optional callback `onObjectInteract(objectId)`.
   The hint text uses the object's `hint` when set; the in-range object gets the
   `.in-range` glow (same pattern as trigger zones).
3. `main.ts` `onStageObject(objectId)` finds the object on the current scene and
   dispatches on `interaction.kind` (exhaustive switch):
   - `openDialog` → set `activeDialog`, `worldRuntime.freeze(true)`, re-render.
   - `finish` → `engine.completeChapter()` or `engine.advanceScene(targetSceneId)`.
4. `GameView.renderGameView` renders each object as a `.stage-object` element
   (emoji sprite from `OBJECT_SPRITES` + optional label), %-positioned at its cell
   center; while `phase === "exploring"` it's a `<button>` whose click calls the same
   dispatch (tap/click fallback). Objects are **not** collision solids.

## SceneEngine finish paths (`SceneEngine.ts`)

- `advanceScene(targetSceneId?)` — public; resolves target ?? `nextSceneId`, errors
  via `onError` if unresolvable, else `loadScene`.
- `completeChapter()` — public; idempotent push to `progress.chaptersCompleted`,
  save, `onCelebration()`. Mirrors the finale-decision branch in `resolveDecision`
  (which is untouched — ch2's `dp_crossing` finale still works exactly as before).
- `loadScene` narration auto-advance is **skipped when the scene has a
  `finish`/`advance` object** — the player walks to the finish instead of being
  teleported on a timer.

## Current content (demo of the framework)

| Scene | Object | Interaction |
|---|---|---|
| ch1 `e1` | `obj_meadow_sign` 🪧 | `openDialog → dlg_meadow_welcome` (Flicker, 2 pages) |
| ch1 `e2` | `obj_meadow_gate` 🏁 "North Gate" | `finish/advance` → e3 (replaces e2's auto-advance timer) |
| ch1 `e3` | `obj_meadow_arch` 🌈 "Celebration Arch" | `finish/complete` — alternate completion; `dp_ask_grownup` still works |
| ch2 `w1` | `obj_bridge_notice` 📜 | `openDialog → dlg_bridge_legend` (Wize, 3 pages) |
| ch2 `w7` | `obj_bridge_finish` ✅ "Level Complete" | `finish/complete` — north bank, past the bridge |

Ch2 completes via the w7 checkmark: `dp_crossing` (strong) advances w6 → w7, Flicker
stops blocking the bridge (his `solidSize` solid is only in w1–w6), and the player
physically crosses to the finish object. `dp_crossing` is no longer in
`CHAPTER_COMPLETE_DECISION`.

## Authoring guide

- **New object:** add an entry to the scene JSON's `objects[]`. Pick a walkable cell
  (check with `?gridDebug=1`) that isn't inside a trigger zone (triggers win
  proximity).
- **New sprite:** one entry in `OBJECT_SPRITES` (`src/content/stageObjects.ts`).
- **New dialog:** create `content/chapters/<ch>/dlg_<name>.json`, register it in
  `DIALOGS` (`src/content/index.ts`).
- **New stage:** scene JSON with `gridMapId` (+ grid builder if new — see
  [world-grid-levels.md](./world-grid-levels.md)), objects for its interactions, and
  a `finish` object (`advance` to chain stages, `complete` on the last one).

## Validation & tests

- `scripts/validate-content.ts`: `dlg_*` files need `id`/`chapterId`/non-empty
  `pages[].text`; scene `objects[]` need unique ids, 0–99 cells, resolvable
  `dialogId`, valid finish `mode`, resolvable advance target.
- `tests/unit/stageObjects.test.ts` (10 tests): cell→world conversion parity,
  object placement, sprite fallback, content integrity (walkable cells, registered
  dialogs, resolvable targets, ch2 finale guard), `advanceScene`/`completeChapter`
  behavior, auto-advance suppression (fake timers).
- Verified in-browser 2026-07-17 (`npm run demo`): sign + scroll dialogs
  (pages/portrait/freeze/unfreeze/no click-through), North Gate advance e2→e3, arch
  → Level Complete celebration, e2 no longer auto-advances, ch1/ch2 decision flows
  unchanged. Note: rAF (and thus walking) pauses while the Chrome window is fully
  occluded — same known throttling as [world-grid-levels.md](./world-grid-levels.md).
