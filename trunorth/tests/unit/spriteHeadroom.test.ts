import { describe, it, expect } from "vitest";
import { MIN_FEET_Y, keepSpriteOnScreen } from "../../src/engine/WorldRuntime.js";

/**
 * Characters were rendering with their heads cut off by the top of the frame.
 *
 * Sprites are feet-anchored (`translate(-50%, -100%)`) and ~110–120 world px tall, so a
 * character whose feet sit less than a sprite-height from the top of the world draws above
 * `y = 0`. The camera can't compensate — it's already clamped to the world's top edge, and
 * translating further would reveal empty space above the background — so movement is
 * clamped instead. `scripts/validate-content.ts` guards the *authored* side of the same
 * rule; this guards the *player-controlled* side.
 */
describe("sprite headroom (top-of-frame clipping)", () => {
  it("clamps feet that would put the sprite's head above the frame", () => {
    expect(keepSpriteOnScreen({ x: 400, y: 0 }).y).toBe(MIN_FEET_Y);
    expect(keepSpriteOnScreen({ x: 400, y: 90 }).y).toBe(MIN_FEET_Y);
    expect(keepSpriteOnScreen({ x: 400, y: MIN_FEET_Y - 1 }).y).toBe(MIN_FEET_Y);
  });

  it("leaves positions with enough headroom untouched", () => {
    expect(keepSpriteOnScreen({ x: 400, y: MIN_FEET_Y }).y).toBe(MIN_FEET_Y);
    expect(keepSpriteOnScreen({ x: 400, y: 800 }).y).toBe(800);
    expect(keepSpriteOnScreen({ x: 400, y: 1040 }).y).toBe(1040);
  });

  it("never alters horizontal position", () => {
    expect(keepSpriteOnScreen({ x: 137, y: 10 }).x).toBe(137);
    expect(keepSpriteOnScreen({ x: 1783, y: 900 }).x).toBe(1783);
  });

  it("clears the tallest sprite (worry_cloud at 120px) with margin", () => {
    expect(MIN_FEET_Y).toBeGreaterThan(120);
  });
});
