import { describe, it, expect } from "vitest";
import { SCENES, DIALOGS } from "../../src/content/index.js";
import { OBJECT_SPRITES, OBJECT_SPRITE_FALLBACK, objectSprite, objectWorldPos } from "../../src/content/stageObjects.js";
import type { Scene } from "../../src/types/index.js";

/**
 * The explore → discover → decide loop (spec §5 core loop, §7.1 brownie points).
 *
 * The problem this guards against returning: every Ch.1 scene was spawn → walk into a
 * hitbox → answer. Movement had no purpose because there was nothing to look for and
 * nothing to learn by looking. These tests assert each scene gives the child a stated
 * goal and real things to find *before* its decision.
 */

const scenes = Object.values(SCENES) as Scene[];
const ch1 = scenes.filter((s) => s.chapterId === "ch1");
const discoverables = (s: Scene) =>
  (s.objects ?? []).filter((o) => o.interaction.kind === "openDialog");

describe("Every Ch.1 scene gives the child a reason to move", () => {
  it("states a goal on arrival", () => {
    for (const scene of ch1) {
      expect(scene.goal, `${scene.id} has no goal — the child won't know what to look for`)
        .toBeTruthy();
      expect(scene.goal!.length).toBeGreaterThan(15);
    }
  });

  it("has at least two things to examine", () => {
    for (const scene of ch1) {
      expect(
        discoverables(scene).length,
        `${scene.id} has ${discoverables(scene).length} discoverable(s) — not enough to explore`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("wires every discoverable to a registered dialog with real content", () => {
    for (const scene of ch1) {
      for (const obj of discoverables(scene)) {
        const dialogId = (obj.interaction as { dialogId: string }).dialogId;
        const dialog = DIALOGS[dialogId];
        expect(dialog, `${scene.id}/${obj.id} points at missing dialog ${dialogId}`).toBeDefined();
        expect(dialog.pages.length).toBeGreaterThanOrEqual(1);
        for (const page of dialog.pages) {
          expect(page.text.trim().length, `${dialogId} has an empty page`).toBeGreaterThan(20);
        }
      }
    }
  });

  it("gives every discoverable a real sprite, not the unknown-asset fallback", () => {
    for (const scene of scenes) {
      for (const obj of scene.objects ?? []) {
        expect(
          objectSprite(obj.assetRef),
          `${obj.id} uses unmapped assetRef "${obj.assetRef}"`,
        ).not.toBe(OBJECT_SPRITE_FALLBACK);
        expect(OBJECT_SPRITES[obj.assetRef]).toBeDefined();
      }
    }
  });

  it("labels every discoverable so the child can tell what it is", () => {
    for (const scene of ch1) {
      for (const obj of discoverables(scene)) {
        expect(obj.label ?? obj.hint, `${obj.id} has no label`).toBeTruthy();
      }
    }
  });

  /**
   * Authoring the discovery pass produced seven collisions in one pass — objects buried
   * under characters and objects sitting inside decision triggers, where the decision
   * fires before the child can examine anything. `validate-content` enforces this in CI;
   * this covers the registry the app actually loads.
   */
  it("keeps discoverables clear of characters and decision triggers", () => {
    for (const scene of scenes) {
      for (const obj of scene.objects ?? []) {
        const { x, y } = objectWorldPos(obj);

        for (const ch of scene.characters) {
          const dist = Math.hypot(x - ch.position[0], y - ch.position[1]);
          expect(
            dist,
            `${scene.id}/${obj.id} is ${Math.round(dist)}px from character ${ch.id}`,
          ).toBeGreaterThanOrEqual(150);
        }

        for (const trigger of scene.triggers) {
          const [tx, ty, tw, th] = trigger.bounds;
          const inside = x >= tx - 40 && x <= tx + tw + 40 && y >= ty - 40 && y <= ty + th + 40;
          expect(
            inside,
            `${scene.id}/${obj.id} sits inside trigger ${trigger.id} — the decision fires first`,
          ).toBe(false);
        }
      }
    }
  });

  it("still lets the child reach the decision without examining anything", () => {
    // Exploring is optional delight (§7.6). Progress must never depend on it.
    for (const scene of ch1) {
      const canAdvance =
        scene.decisionPoints.length > 0 ||
        Boolean(scene.nextSceneId) ||
        (scene.objects ?? []).some((o) => o.interaction.kind === "finish");
      expect(canAdvance, `${scene.id} cannot be completed without exploring`).toBe(true);
    }
  });
});
