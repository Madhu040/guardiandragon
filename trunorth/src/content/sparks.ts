import type { GameState, Scene, SceneCollectible } from "../types/index.js";

/**
 * Kindness Sparks — the replayable micro-loop (spec §7.6).
 *
 * The problem this solves: Chapter 1 shipped with **one** collectible across six scenes,
 * so every scene was walk-to-trigger → answer → next scene. That reads as a quiz, not a
 * world. §7.1 asks for brownie points scattered for "immediate, low-stakes fun", and §7.6
 * asks for a few of them to sit behind kind actions or exploration.
 *
 * Two rules from the spec that shape everything here:
 *
 * - **Never required to progress.** A child who beelines to the decision still finishes the
 *   chapter with the full experience. Sparks are optional delight, never a gate.
 * - **Not maxed on a first play.** The celebration shows "you found 4 of 6" precisely so a
 *   second run is "find what I missed" — intrinsic motivation, not "play again".
 */

/** Has this decision point been resolved in the `strong` band? */
function resolvedStrongly(state: GameState, decisionPointId: string): boolean {
  return state.eventLog.some(
    (e) => e.decisionPointId === decisionPointId && e.scoreBand === "strong",
  );
}

/**
 * The sparks currently visible in a scene. Ungated sparks are always present; gated ones
 * appear only once their kind action has happened (§7.6).
 */
export function visibleSparks(scene: Scene, state: GameState): SceneCollectible[] {
  return scene.collectibles.filter((c) => !c.gate || resolvedStrongly(state, c.gate));
}

/**
 * Kindness Sparks vs. crystals — two different jobs, deliberately kept apart.
 *
 * A **spark** (`kindness_spark`) is the §7.6 replay mechanic: few, often gated behind a kind
 * action, and counted in the celebration's "you found 4 of 6" tally.
 *
 * A **crystal** (`crystal`) is §7.1's "brownie points scattered for immediate, low-stakes
 * fun" — plentiful, never gated, strewn along the walking routes so moving through the world
 * is rewarding in itself. Crystals feed the 💎 counter but are deliberately **excluded from
 * the spark tally**, because mixing them in would inflate the denominator and destroy the
 * "find what I missed" signal that makes a second playthrough meaningful.
 */
export function isKindnessSpark(c: SceneCollectible): boolean {
  return c.kind === "kindness_spark";
}

/** Total sparks discoverable in a chapter — the denominator in "found 4 of 6". */
export function chapterSparkTotal(scenes: Scene[], chapterId: string): number {
  return scenes
    .filter((s) => s.chapterId === chapterId)
    .reduce((total, s) => total + s.collectibles.filter(isKindnessSpark).length, 0);
}

/** How many sparks the child actually found in this chapter (crystals don't count). */
export function chapterSparksFound(
  scenes: Scene[],
  chapterId: string,
  state: GameState,
): number {
  let found = 0;
  for (const scene of scenes.filter((s) => s.chapterId === chapterId)) {
    const collected = new Set(state.progress.kindnessSparksFound[scene.id] ?? []);
    found += scene.collectibles.filter((c) => isKindnessSpark(c) && collected.has(c.id)).length;
  }
  return found;
}
