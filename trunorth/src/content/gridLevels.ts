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

/** Forest of Questions — a mossy clearing with a winding path through the trees. */
function buildForestOfQuestions(): GridLevel {
  const moss = "#3f7a4c";
  const mossDark = "#356a41";
  const trees = "#254a30";
  const path = "#8a9b6e";
  const glade = "#5a9a68";

  const map = new GridMap({ color: moss, walkable: true });

  map
    .paintEllipse(30, 40, 10, 7, { color: mossDark })
    .paintEllipse(65, 65, 11, 8, { color: mossDark })
    .paintEllipse(20, 75, 8, 6, { color: mossDark });

  // Curious little glades where questions get asked
  map
    .paintEllipse(75, 30, 6, 5, { color: glade })
    .paintEllipse(35, 20, 5, 4, { color: glade });

  map.paintBorder(4, { color: trees, walkable: false });

  // Winding dirt path from spawn (south) up to the north gate
  map
    .paintRect(46, 60, 10, 30, { color: path })
    .paintRect(30, 52, 26, 10, { color: path })
    .paintRect(30, 20, 10, 34, { color: path })
    .paintRect(30, 4, 10, 18, { color: path, walkable: true });

  return { id: "forest-of-questions", name: "Forest of Questions", spawnCell: [50, 85], map };
}

/** Meadow of Curiosity — a field of giant worry-flowers that shrink under a curious look. */
function buildMeadowOfCuriosity(): GridLevel {
  const grass = "#6ab04c";
  const grassDark = "#5da043";
  const hedge = "#2f6b3a";
  const flowerBig = "#c56cd6";
  const flowerBigRim = "#a854b8";
  const flowerSmall = "#e8a6f0";
  const path = "#d9c48a";

  const map = new GridMap({ color: grass, walkable: true });

  map
    .paintEllipse(25, 30, 10, 7, { color: grassDark })
    .paintEllipse(75, 60, 12, 8, { color: grassDark });

  map.paintBorder(3, { color: hedge, walkable: false });

  // Giant worry-flowers — some huge, some tiny, decorative (walkable around, not on top)
  map
    .paintEllipse(70, 25, 9, 7, { color: flowerBigRim, walkable: false })
    .paintEllipse(70, 25, 6, 5, { color: flowerBig, walkable: false })
    .paintEllipse(22, 60, 4, 3, { color: flowerSmall, walkable: false })
    .paintEllipse(45, 78, 3, 2, { color: flowerSmall, walkable: false });

  // Path from spawn to the far welcome gate
  map
    .paintRect(46, 55, 8, 35, { color: path })
    .paintRect(40, 6, 20, 12, { color: path, walkable: true });

  return { id: "meadow-of-curiosity", name: "Meadow of Curiosity", spawnCell: [50, 85], map };
}

/** Cave of Purpose — glowing memory-crystals line a quiet stone chamber. */
function buildCaveOfPurpose(): GridLevel {
  const stone = "#4a4f5c";
  const stoneDark = "#3c4049";
  const wall = "#26282f";
  const crystal = "#7fd8e0";
  const crystalGlow = "#a6ecf2";

  const map = new GridMap({ color: stone, walkable: true });

  map
    .paintEllipse(30, 35, 9, 7, { color: stoneDark })
    .paintEllipse(70, 55, 10, 8, { color: stoneDark })
    .paintEllipse(45, 70, 7, 5, { color: stoneDark });

  map.paintBorder(5, { color: wall, walkable: false });

  // Rock pillars
  map
    .paintRect(18, 20, 6, 6, { color: wall, walkable: false })
    .paintRect(76, 24, 6, 6, { color: wall, walkable: false })
    .paintRect(20, 68, 5, 5, { color: wall, walkable: false });

  // Glowing memory-crystal veins
  map
    .paintEllipse(35, 45, 3, 5, { color: crystalGlow, walkable: false })
    .paintEllipse(35, 45, 2, 3, { color: crystal, walkable: false })
    .paintEllipse(65, 30, 3, 4, { color: crystalGlow, walkable: false })
    .paintEllipse(65, 30, 2, 2, { color: crystal, walkable: false });

  return { id: "cave-of-purpose", name: "Cave of Purpose", spawnCell: [50, 85], map };
}

/** Mountain of Helpers — a switchback climb up to the Sky Festival stage. */
function buildMountainFestival(): GridLevel {
  const rockLow = "#6b6f7a";
  const rockHigh = "#5a5e68";
  const cliff = "#454954";
  const path = "#c9b389";
  const stage = "#e0b84d";
  const stageRim = "#b8933a";
  const sky = "#8fb8d6";

  const map = new GridMap({ color: rockLow, walkable: true });

  map.paintRect(0, 0, GRID_COLS, 22, { color: sky, walkable: false });
  map.paintRect(0, 22, GRID_COLS, 30, { color: rockHigh });

  map.paintBorder(4, { color: cliff, walkable: false });

  // Switchback path climbing from spawn (south) to the festival stage (north)
  map
    .paintRect(44, 74, 10, 20, { color: path })
    .paintRect(20, 64, 34, 10, { color: path })
    .paintRect(20, 40, 10, 24, { color: path })
    .paintRect(20, 34, 42, 8, { color: path })
    .paintRect(52, 22, 10, 20, { color: path });

  // Festival stage platform at the top of the climb
  map
    .paintRect(38, 8, 24, 16, { color: stageRim, walkable: true })
    .paintRect(40, 10, 20, 12, { color: stage, walkable: true });

  return { id: "mountain-festival", name: "Mountain of Helpers", spawnCell: [50, 90], map };
}

const LEVEL_BUILDERS: Record<string, () => GridLevel> = {
  "everbright-meadow": buildEverbrightMeadow,
  "singing-bridge": buildSingingBridge,
  "forest-of-questions": buildForestOfQuestions,
  "meadow-of-curiosity": buildMeadowOfCuriosity,
  "cave-of-purpose": buildCaveOfPurpose,
  "mountain-festival": buildMountainFestival,
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
