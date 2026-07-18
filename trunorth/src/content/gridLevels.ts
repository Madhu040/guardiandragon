/**
 * Grid level definitions — parameterized 100×100 backgrounds with walkable and
 * blocked cells (see `src/engine/GridMap.ts`).
 *
 * Add a level: write a builder below and register it in LEVEL_BUILDERS.
 * Test any level in the running app with `?grid=<id>`
 * (e.g. http://localhost:5173/?demo=1&grid=singing-bridge); add `&gridDebug=1`
 * to tint blocked cells red.
 */

import { GRID_COLS, GRID_ROWS, GridMap } from "../engine/GridMap.js";
import type { Scene } from "../types/index.js";

export interface GridLevel {
  id: string;
  name: string;
  /** Grid cell [col, row] where the avatar spawns. */
  spawnCell: [number, number];
  map: GridMap;
}

/** Everbright Meadow — open field with a pond, boulders, and a dirt trail north. */
function buildEverbrightMeadow(): GridLevel {
  const grass = "#5aa85e";
  const grassDark = "#4f9c55";
  const trees = "#2e6b3a";
  const trail = "#c9a36b";
  const water = "#3d7dc4";
  const waterRim = "#356fae";
  const rock = "#8a8f98";

  const map = new GridMap({ color: grass, walkable: true });

  // Mottled grass patches (walkable, decorative)
  map
    .paintEllipse(20, 30, 9, 6, { color: grassDark })
    .paintEllipse(70, 20, 12, 7, { color: grassDark })
    .paintEllipse(82, 70, 10, 8, { color: grassDark })
    .paintEllipse(35, 85, 8, 5, { color: grassDark });

  // Tree line around the whole meadow
  map.paintBorder(3, { color: trees, walkable: false });

  // Pond with a darker rim
  map
    .paintEllipse(72, 45, 14, 10, { color: waterRim, walkable: false })
    .paintEllipse(72, 45, 12, 8, { color: water, walkable: false });

  // Boulder clusters
  map
    .paintRect(22, 55, 6, 5, { color: rock, walkable: false })
    .paintRect(26, 58, 5, 4, { color: rock, walkable: false })
    .paintRect(50, 22, 5, 4, { color: rock, walkable: false });

  // Dirt trail: spawn → west around the pond → north gate
  map
    .paintRect(46, 60, 8, 30, { color: trail })
    .paintRect(38, 56, 16, 6, { color: trail })
    .paintRect(38, 12, 8, 48, { color: trail })
    .paintRect(38, 3, 8, 9, { color: trail, walkable: true }); // gate through the trees

  return { id: "everbright-meadow", name: "Everbright Meadow", spawnCell: [50, 80], map };
}

/** The Singing Bridge — a river splits the level; the bridge is the only crossing. */
function buildSingingBridge(): GridLevel {
  const bankSouth = "#4f8f5a";
  const bankNorth = "#57996b";
  const cliffs = "#54586b";
  const river = "#2f7fae";
  const riverGlint = "#3c93c4";
  const planks = "#a5763d";
  const rails = "#7c5327";
  const crystal = "#b98ae0";

  const map = new GridMap({ color: bankSouth, walkable: true });

  // North bank + cliff wall at the top edge
  map.paintRect(0, 0, GRID_COLS, 38, { color: bankNorth });
  map.paintRect(0, 0, GRID_COLS, 6, { color: cliffs, walkable: false });

  // River band across the middle, with glint stripes
  map.paintRect(0, 38, GRID_COLS, 22, { color: river, walkable: false });
  map
    .paintRect(0, 43, GRID_COLS, 1, { color: riverGlint, walkable: false })
    .paintRect(0, 50, GRID_COLS, 1, { color: riverGlint, walkable: false })
    .paintRect(0, 55, GRID_COLS, 1, { color: riverGlint, walkable: false });

  // The bridge: walkable planks with blocked rails on both sides
  map.paintRect(46, 36, 8, 26, { color: planks, walkable: true });
  map
    .paintRect(45, 36, 1, 26, { color: rails, walkable: false })
    .paintRect(54, 36, 1, 26, { color: rails, walkable: false });

  // Shimmer Crystal outcrops on the banks
  map
    .paintEllipse(18, 74, 4, 3, { color: crystal, walkable: false })
    .paintEllipse(80, 24, 4, 3, { color: crystal, walkable: false })
    .paintEllipse(14, 20, 3, 2, { color: crystal, walkable: false });

  // Side walls so the river can't be skirted at the edges
  map
    .paintRect(0, 6, 2, GRID_ROWS - 6, { color: cliffs, walkable: false })
    .paintRect(GRID_COLS - 2, 6, 2, GRID_ROWS - 6, { color: cliffs, walkable: false });

  return { id: "singing-bridge", name: "The Singing Bridge", spawnCell: [50, 85], map };
}

const LEVEL_BUILDERS: Record<string, () => GridLevel> = {
  "everbright-meadow": buildEverbrightMeadow,
  "singing-bridge": buildSingingBridge,
};

const levelCache = new Map<string, GridLevel>();

export function getGridLevel(id: string): GridLevel | null {
  const build = LEVEL_BUILDERS[id];
  if (!build) return null;
  let level = levelCache.get(id);
  if (!level) {
    level = build();
    levelCache.set(id, level);
  }
  return level;
}

export function listGridLevelIds(): string[] {
  return Object.keys(LEVEL_BUILDERS);
}

function queryParam(name: string, search?: string): string | null {
  const s = search ?? (typeof location !== "undefined" ? location.search : "");
  return new URLSearchParams(s).get(name);
}

/** URL `?grid=<id>` wins (easy testing); otherwise the scene's own `gridMapId`. */
export function resolveGridLevel(
  scene: Pick<Scene, "gridMapId"> | null,
  search?: string,
): GridLevel | null {
  const fromQuery = queryParam("grid", search);
  if (fromQuery) return getGridLevel(fromQuery);
  return scene?.gridMapId ? getGridLevel(scene.gridMapId) : null;
}

/** `?gridDebug=1` — tint blocked cells red in the background canvas. */
export function isGridDebug(search?: string): boolean {
  return queryParam("gridDebug", search) !== null;
}
