# Grid levels (parameterized backgrounds + walkability)

**Sources:** `trunorth/src/engine/GridMap.ts`, `trunorth/src/content/gridLevels.ts`,
`trunorth/src/render/gridBackground.ts` (+ integration points in
`src/engine/WorldRuntime.ts`, `src/ui/GameView.ts`, `src/types/index.ts`,
`src/styles/global.css`, `tests/unit/grid.test.ts`)

A stage can now be described as a **100×100 grid of cells** instead of a background
image. Each cell stores its coordinate, fill color, and whether the player can walk
through it, so any level layout (rivers, walls, ponds, bridges) is built by painting
cells — no art assets required. Coexists with the image-background scenes; a scene
only uses a grid when one resolves for it.

## `src/engine/GridMap.ts` — grid model + collision

- `GRID_COLS` / `GRID_ROWS` = 100. Cells span the 1920×1080 scene space
  (`cellW` 19.2 px, `cellH` 10.8 px).
- `GridCell { col, row, color, walkable }`; `GridMap.cells` is a **flat row-major
  vector** (`cells[row * cols + col]`, 10 000 entries), seeded from a fill style.
- Lookup: `cellAt(col,row)` (null out of range), `cellAtWorld(wx,wy)`,
  `cellCenterWorld(col,row)`, `isWalkableWorld(wx,wy)` (outside grid ⇒ false).
- Painting (all return `this` for chaining): `paint`, `paintRect`,
  `paintBorder(thickness)`, `paintEllipse(centerCol,centerRow,rx,ry)` — each takes a
  `Partial<GridCellStyle>` so you can change color, walkability, or both.
- `moveWithGridCollision(center, delta, grid, solids?)` — axis-separated **point**
  collision for the main character's center: X then Y, each axis rejected
  independently (wall sliding). Optional NPC `Aabb[]` solids also block the point.

## `src/content/gridLevels.ts` — level definitions + registry

- `GridLevel { id, name, spawnCell: [col,row], map: GridMap }`.
- Builders (cached in `getGridLevel(id)`):
  - **`everbright-meadow`** — tree border, pond, boulder clusters, dirt trail with a
    gate through the north tree line. Spawn [50, 80].
  - **`singing-bridge`** — river band (rows 38–59) splits north/south banks; the
    plank bridge (cols 46–53) is the only crossing; rails, top cliff wall, side
    walls, crystal outcrops. Spawn [50, 85].
- `listGridLevelIds()`, `resolveGridLevel(scene, search?)` — **URL `?grid=<id>`
  wins** (testing), else `scene.gridMapId`. **Every scene JSON now sets `gridMapId`**
  (ch1 e1–e3 → `everbright-meadow`, ch2 w1–w6 → `singing-bridge`), so grids are the
  levels; ch3 Forest was removed 2026-07-17. `isGridDebug()` — `?gridDebug=1`.
- Adding a level = write a builder + register it in `LEVEL_BUILDERS`, then point the
  scene JSONs' `gridMapId` (or a new scenario's scenes) at it.

## `src/render/gridBackground.ts` — canvas renderer

`renderGridBackground(viewport, level, debug)` draws the cell vector to a
`canvas.grid-bg` (one canvas pixel per cell), scaled to the viewport by CSS with
`image-rendering: pixelated`. Debug mode tints non-walkable cells red.
`createGridThumbnail(level)` returns a `.zone-thumb.zone-thumb-grid` canvas used by
the scenario hub cards (`screens.ts`); PNG zone thumbs remain the fallback for
scenarios without a grid.

## Integration

- `GameView.renderGameView` — resolves the grid per scene; if present, renders the
  canvas instead of the `.scene-bg` image div, and the stage tag / zone sign show the
  level name.
- `WorldRuntime` — on scene change resolves the grid; when present it re-seeds the
  avatar at `spawnCell` and `stepMovement` uses `moveWithGridCollision` on the
  **avatar's center** (`AVATAR_CENTER_OFFSET_Y` = 55 px above the feet anchor,
  since sprites anchor bottom-center at ~110 px tall) instead of the AABB
  feet-box/walk-band path. NPC solids still block. Companion follow, collectibles,
  and proximity interact are unchanged.

## Testing

- `tests/unit/grid.test.ts` — 6 tests: cell vector shape/coords, painting + world
  lookup, axis-separated slide, registry integrity (size + walkable spawns), query
  vs scene resolution, bridge-only river crossing.
- Manual: `npm run demo` → `http://localhost:4173/?demo=1&grid=singing-bridge`
  (any scenario) · `&gridDebug=1` for the walkability overlay.
- Verified in-browser (2026-07-17): spawn seeding, river/cliff/side-wall blocking
  with edge sliding, bridge-only crossing. Note: the rAF loop pauses when the
  browser window is occluded (standard Chrome throttling) — movement resumes on
  focus; not a bug.
