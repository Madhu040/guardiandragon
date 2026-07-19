import { describe, it, expect } from "vitest";
import { GRID_COLS, GRID_ROWS, GridMap, moveWithGridCollision } from "../../src/engine/GridMap.js";
import { WORLD_H, WORLD_W, characterFeetBox } from "../../src/engine/Collision.js";
import { getGridLevel, listGridLevelIds, resolveGridLevel } from "../../src/content/gridLevels.js";
import { SCENARIOS } from "../../src/content/scenarios.js";
import { SCENES, getScene } from "../../src/content/index.js";

describe("GridMap", () => {
  it("stores a full 100×100 cell vector with coordinates", () => {
    const map = new GridMap({ color: "#5aa85e", walkable: true });
    expect(map.cells).toHaveLength(GRID_COLS * GRID_ROWS);
    expect(map.cellAt(99, 99)).toMatchObject({ col: 99, row: 99, walkable: true });
    expect(map.cellAt(100, 0)).toBeNull();
    expect(map.cellAt(-1, 5)).toBeNull();
  });

  it("paints color and walkability, and maps world points to cells", () => {
    const map = new GridMap({ color: "#5aa85e", walkable: true });
    map.paintRect(10, 10, 5, 5, { color: "#3d7dc4", walkable: false });

    const inside = map.cellAtWorld(12 * map.cellW + 1, 12 * map.cellH + 1);
    expect(inside).toMatchObject({ col: 12, row: 12, color: "#3d7dc4", walkable: false });
    expect(map.isWalkableWorld(12 * map.cellW + 1, 12 * map.cellH + 1)).toBe(false);
    expect(map.isWalkableWorld(50 * map.cellW, 50 * map.cellH)).toBe(true);
    // Outside the world is never walkable
    expect(map.isWalkableWorld(-10, 100)).toBe(false);
    expect(map.isWalkableWorld(WORLD_W + 10, WORLD_H + 10)).toBe(false);
  });

  it("slides along blocked cells with axis-separated center-point collision", () => {
    const map = new GridMap({ color: "#5aa85e", walkable: true });
    // Vertical wall at column 30
    map.paintRect(30, 0, 1, GRID_ROWS, { walkable: false });

    const start = { x: 29.4 * map.cellW, y: 50 * map.cellH };
    const moved = moveWithGridCollision(start, { x: map.cellW, y: map.cellH }, map);
    expect(moved.x).toBe(start.x); // blocked by the wall
    expect(moved.y).toBe(start.y + map.cellH); // still slides down
  });
});

describe("grid levels", () => {
  it("registers full-size levels with a walkable spawn cell", () => {
    const ids = listGridLevelIds();
    expect(ids.length).toBeGreaterThanOrEqual(2);
    for (const id of ids) {
      const level = getGridLevel(id)!;
      expect(level.name).toBeTruthy();
      expect(level.map.cells).toHaveLength(GRID_COLS * GRID_ROWS);
      const [col, row] = level.spawnCell;
      expect(level.map.cellAt(col, row)?.walkable).toBe(true);
    }
  });

  it("resolves levels from the ?grid= query first, then the scene", () => {
    expect(resolveGridLevel({ gridMapId: "everbright-meadow" }, "?grid=singing-bridge")?.id).toBe(
      "singing-bridge",
    );
    expect(resolveGridLevel({ gridMapId: "everbright-meadow" }, "")?.id).toBe("everbright-meadow");
    expect(resolveGridLevel(null, "")).toBeNull();
    expect(resolveGridLevel(null, "?grid=nope")).toBeNull();
  });

  it("routes every child scenario and scene to a registered grid level", () => {
    const childScenarios = SCENARIOS.filter((s) => s.audience === "child");
    expect(childScenarios.map((s) => s.id).sort()).toEqual(["ch1", "ch2", "ch3", "ch4"]);
    for (const scenario of childScenarios) {
      const gridId = getScene(scenario.startSceneId)?.gridMapId;
      expect(gridId, `${scenario.id} start scene has a gridMapId`).toBeTruthy();
      expect(getGridLevel(gridId!)).not.toBeNull();
    }
    for (const scene of Object.values(SCENES)) {
      expect(scene.gridMapId, `scene ${scene.id} bound to a grid level`).toBeTruthy();
      expect(getGridLevel(scene.gridMapId!)).not.toBeNull();
    }
  });

  it("keeps the singing-bridge crossing walkable only over the bridge", () => {
    const level = getGridLevel("singing-bridge")!;
    // Mid-river, mid-bridge cell is walkable planks
    expect(level.map.cellAt(50, 48)?.walkable).toBe(true);
    // Mid-river away from the bridge is water
    expect(level.map.cellAt(20, 48)?.walkable).toBe(false);
    expect(level.map.cellAt(80, 48)?.walkable).toBe(false);
  });

  it("lets Flicker's widened solid seal the path until w7", () => {
    const w6 = getScene("w6")!;
    const level = getGridLevel(w6.gridMapId!)!;
    const flicker = w6.characters.find((c) => c.id === "flicker")!;
    const [w, h] = flicker.solidSize!;
    const box = characterFeetBox(flicker.position[0], flicker.position[1], w, h);

    // Every approach across Flicker's own footprint is blocked by the solid…
    for (const dx of [-60, 0, 60]) {
      const x = flicker.position[0] + dx;
      const start = { x, y: box.y + box.h + 6 };
      const moved = moveWithGridCollision(start, { x: 0, y: -12 }, level.map, [box]);
      expect(moved.y, `blocked at x=${x}`).toBe(start.y);
    }

    // …and in w7 Flicker stands aside (no widened solidSize), so the same walk crosses freely.
    const w7Flicker = getScene("w7")!.characters.find((c) => c.id === "flicker")!;
    expect(w7Flicker.solidSize).toBeUndefined();
    const clearBox = characterFeetBox(w7Flicker.position[0], w7Flicker.position[1]);
    const start = { x: flicker.position[0] + 60, y: box.y + box.h + 6 };
    const moved = moveWithGridCollision(start, { x: 0, y: -12 }, level.map, [clearBox]);
    expect(moved.y).toBe(start.y - 12);
  });
});
