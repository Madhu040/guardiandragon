import { describe, it, expect } from "vitest";
import { getGridLevel } from "../../src/content/gridLevels.js";
import { SCENES } from "../../src/content/index.js";
import { MIN_FEET_Y } from "../../src/engine/WorldRuntime.js";
import type { Scene } from "../../src/types/index.js";

/**
 * The child has to *travel* to the decision (owner playtest: "it is still stuck to the
 * square… I wanted to move around, go for some time, pick some diamonds on the way before
 * getting to answers").
 *
 * The measured cause: levels are shared between scenes, so a single per-level spawn left
 * the child 174–372px from the decision — under a second of walking at 420px/s — with
 * 71–86% of the map, every crystal and every discovery, trivially skippable. `Scene.spawnCell`
 * now starts each scene across the level from its own decision.
 *
 * The dangerous failure mode of "spawn far away" is spawning somewhere the child cannot walk
 * *from* — across the pond, behind the tree line — which soft-locks the scene. That's what
 * the reachability test guards.
 */

const scenes = Object.values(SCENES) as Scene[];
const withSpawn = scenes.filter((s) => s.spawnCell && s.gridMapId);
const AVATAR_CENTER_OFFSET_Y = 55;
/** Below this the walk is too short to count as a journey (≈2s at 420px/s). */
const MIN_JOURNEY_PX = 800;

function triggerCentre(scene: Scene): { x: number; y: number } | null {
  const t = scene.triggers?.[0];
  if (!t) return null;
  const [x, y, w, h] = t.bounds;
  return { x: x + w / 2, y: y + h / 2 };
}

describe("scene spawn — the decision is a journey, not a step", () => {
  it("gives the scenes with a decision their own spawn", () => {
    expect(withSpawn.length).toBeGreaterThanOrEqual(10);
  });

  it("spawns on a walkable cell", () => {
    for (const scene of withSpawn) {
      const grid = getGridLevel(scene.gridMapId!)!;
      const cell = grid.map.cellAt(scene.spawnCell![0], scene.spawnCell![1]);
      expect(cell, `${scene.id} spawn cell is off the grid`).not.toBeNull();
      expect(cell!.walkable, `${scene.id} spawns on a non-walkable cell`).toBe(true);
    }
  });

  it("leaves the sprite enough headroom at spawn", () => {
    for (const scene of withSpawn) {
      const grid = getGridLevel(scene.gridMapId!)!;
      const p = grid.map.cellCenterWorld(scene.spawnCell![0], scene.spawnCell![1]);
      expect(
        p.y + AVATAR_CENTER_OFFSET_Y,
        `${scene.id} spawns with its head above the frame`,
      ).toBeGreaterThanOrEqual(MIN_FEET_Y);
    }
  });

  it("puts a real walk between the spawn and the decision", () => {
    for (const scene of withSpawn) {
      const grid = getGridLevel(scene.gridMapId!)!;
      const target = triggerCentre(scene);
      if (!target) continue;
      const p = grid.map.cellCenterWorld(scene.spawnCell![0], scene.spawnCell![1]);
      const dist = Math.hypot(p.x - target.x, p.y - target.y);
      expect(
        dist,
        `${scene.id}: only ${Math.round(dist)}px from spawn to the decision — ` +
          `the child can answer without exploring`,
      ).toBeGreaterThanOrEqual(MIN_JOURNEY_PX);
    }
  });

  it("can actually walk from the spawn to the decision (no soft-lock)", () => {
    for (const scene of withSpawn) {
      const grid = getGridLevel(scene.gridMapId!)!;
      const target = triggerCentre(scene);
      if (!target) continue;
      const start = grid.map.cellAt(scene.spawnCell![0], scene.spawnCell![1])!;
      const goal = grid.map.cellAtWorld(target.x, target.y);
      expect(goal, `${scene.id} decision is off the grid`).not.toBeNull();

      // Flood-fill the walkable region from the spawn.
      const seen = new Set([`${start.col},${start.row}`]);
      const queue: Array<[number, number]> = [[start.col, start.row]];
      while (queue.length) {
        const [c, r] = queue.shift()!;
        for (const [dc, dr] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nc = c + dc;
          const nr = r + dr;
          const key = `${nc},${nr}`;
          if (seen.has(key) || !grid.map.cellAt(nc, nr)?.walkable) continue;
          seen.add(key);
          queue.push([nc, nr]);
        }
      }

      expect(
        seen.has(`${goal!.col},${goal!.row}`),
        `${scene.id}: the decision is unreachable from the spawn — the scene soft-locks`,
      ).toBe(true);
    }
  });

  it("puts crystals on the way — the journey pays (§7.1)", () => {
    for (const scene of withSpawn) {
      const crystals = scene.collectibles.filter((c) => c.kind === "crystal");
      expect(crystals.length, `${scene.id} has nothing to collect en route`).toBeGreaterThan(0);
    }
  });
});
