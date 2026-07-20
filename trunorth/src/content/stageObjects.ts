/**
 * Stage object helpers — pure functions over `Scene.objects`
 * (see `StageObject` in `src/types/index.ts`).
 *
 * Objects are authored in grid cells (the same 100×100 unit the levels are
 * painted in, `src/content/gridLevels.ts`) and converted to world pixels here.
 * Add a new sprite: one entry in OBJECT_SPRITES.
 */

import type { Scene, StageObject } from "../types/index.js";
import { gridCellToWorld } from "../engine/GridMap.js";
import type { Vec2 } from "../engine/Collision.js";

/** assetRef → emoji sprite. Unknown refs fall back to OBJECT_SPRITE_FALLBACK. */
export const OBJECT_SPRITES: Record<string, string> = {
  sign_post: "🪧",
  notice_scroll: "📜",
  finish_flag: "🏁",
  finish_check: "✅",
  arch: "🌈",
  // Ch.1 discoverables — each one gives the child a reason to walk somewhere and a piece
  // of context that makes the scene's decision make sense when they reach it.
  flower_crown: "💐",
  play_ball: "🏐",
  deer_friend: "🦌",
  pond: "💧",
  trail_marker: "🪨",
  bush: "🌿",
  dropped_hat: "🧢",
  flower_patch: "🌼",
  basket: "🧺",
  broken_crown: "🥀",
  petals: "🍃",
  bell: "🔔",
  note: "📝",
};

export const OBJECT_SPRITE_FALLBACK = "❔";

export function objectSprite(assetRef: string): string {
  return OBJECT_SPRITES[assetRef] ?? OBJECT_SPRITE_FALLBACK;
}

/** World-pixel position of an object (center of its authored cell). */
export function objectWorldPos(obj: StageObject): Vec2 {
  return gridCellToWorld(obj.cell[0], obj.cell[1]);
}

export function sceneObjects(scene: Scene | null | undefined): StageObject[] {
  return scene?.objects ?? [];
}
