import type { DecisionPoint, DialogRecord, Scene } from "../types/index.js";

import w1 from "../../content/chapters/ch2/w1.scene.json";
import w2 from "../../content/chapters/ch2/w2.scene.json";
import w3 from "../../content/chapters/ch2/w3.scene.json";
import w4 from "../../content/chapters/ch2/w4.scene.json";
import w5 from "../../content/chapters/ch2/w5.scene.json";
import w6 from "../../content/chapters/ch2/w6.scene.json";
import w7 from "../../content/chapters/ch2/w7.scene.json";
import dpQuestStart from "../../content/chapters/ch2/dp_quest_start.json";
import dpInvestigate from "../../content/chapters/ch2/dp_investigate.json";
import dpFactSort from "../../content/chapters/ch2/dp_fact_sort.json";
import dpBreathe from "../../content/chapters/ch2/dp_breathe.json";
import dpChoosePath from "../../content/chapters/ch2/dp_choose_path.json";
import dpCrossing from "../../content/chapters/ch2/dp_crossing.json";

import e1 from "../../content/chapters/ch1/e1.scene.json";
import e2 from "../../content/chapters/ch1/e2.scene.json";
import e2a from "../../content/chapters/ch1/e2a.scene.json";
import e2b from "../../content/chapters/ch1/e2b.scene.json";
import e2c from "../../content/chapters/ch1/e2c.scene.json";
import e3 from "../../content/chapters/ch1/e3.scene.json";
import dpLeftout from "../../content/chapters/ch1/dp_leftout_bench.json";
import dpReassureShy from "../../content/chapters/ch1/dp_reassure_shy.json";
import dpShareFlower from "../../content/chapters/ch1/dp_share_flower.json";
import dpRepairOops from "../../content/chapters/ch1/dp_repair_oops.json";
import dpAskGrownup from "../../content/chapters/ch1/dp_ask_grownup.json";

import dlgMeadowWelcome from "../../content/chapters/ch1/dlg_meadow_welcome.json";
import dlgStarLegend from "../../content/chapters/ch2/dlg_star_legend.json";
import dlgPawPrints from "../../content/chapters/ch2/dlg_paw_prints.json";
import dlgRustlingBush from "../../content/chapters/ch2/dlg_rustling_bush.json";
import dlgWindblownHat from "../../content/chapters/ch2/dlg_windblown_hat.json";
import dlgTornNote from "../../content/chapters/ch2/dlg_torn_note.json";
import dlgWorryPatch from "../../content/chapters/ch2/dlg_worry_patch.json";
import dlgGatheringBasket from "../../content/chapters/ch2/dlg_gathering_basket.json";
import dlgWelcomeBell from "../../content/chapters/ch2/dlg_welcome_bell.json";
import dlgPetalsOnWind from "../../content/chapters/ch2/dlg_petals_on_wind.json";
import dlgMemoryScroll from "../../content/chapters/ch2/dlg_memory_scroll.json";
import dlgFadedMemoryNote from "../../content/chapters/ch2/dlg_faded_memory_note.json";
import dlgReadyCrown from "../../content/chapters/ch2/dlg_ready_crown.json";
import dlgFestivalBell from "../../content/chapters/ch2/dlg_festival_bell.json";
import dlgFlowerCrown from "../../content/chapters/ch1/dlg_flower_crown.json";
import dlgLonelyBall from "../../content/chapters/ch1/dlg_lonely_ball.json";
import dlgDeerTracks from "../../content/chapters/ch1/dlg_deer_tracks.json";
import dlgPondEdge from "../../content/chapters/ch1/dlg_pond_edge.json";
import dlgTrailStones from "../../content/chapters/ch1/dlg_trail_stones.json";
import dlgHidingBush from "../../content/chapters/ch1/dlg_hiding_bush.json";
import dlgDroppedHat from "../../content/chapters/ch1/dlg_dropped_hat.json";
import dlgFlowerPatch from "../../content/chapters/ch1/dlg_flower_patch.json";
import dlgEmptyBasket from "../../content/chapters/ch1/dlg_empty_basket.json";
import dlgBrokenCrown from "../../content/chapters/ch1/dlg_broken_crown.json";
import dlgScatteredPetals from "../../content/chapters/ch1/dlg_scattered_petals.json";
import dlgHelpBell from "../../content/chapters/ch1/dlg_help_bell.json";
import dlgBenchNote from "../../content/chapters/ch1/dlg_bench_note.json";

export const SCENES: Record<string, Scene> = {
  w1: w1 as Scene,
  w2: w2 as Scene,
  w3: w3 as Scene,
  w4: w4 as unknown as Scene,
  w5: w5 as Scene,
  w6: w6 as unknown as Scene,
  w7: w7 as unknown as Scene,
  e1: e1 as unknown as Scene,
  e2: e2 as unknown as Scene,
  e2a: e2a as unknown as Scene,
  e2b: e2b as unknown as Scene,
  e2c: e2c as unknown as Scene,
  e3: e3 as unknown as Scene,
};

export const DECISION_POINTS: Record<string, DecisionPoint> = {
  dp_quest_start: dpQuestStart as DecisionPoint,
  dp_investigate: dpInvestigate as DecisionPoint,
  dp_fact_sort: dpFactSort as DecisionPoint,
  dp_breathe: dpBreathe as DecisionPoint,
  dp_choose_path: dpChoosePath as DecisionPoint,
  dp_crossing: dpCrossing as DecisionPoint,
  dp_leftout_bench: dpLeftout as DecisionPoint,
  dp_reassure_shy: dpReassureShy as DecisionPoint,
  dp_share_flower: dpShareFlower as DecisionPoint,
  dp_repair_oops: dpRepairOops as DecisionPoint,
  dp_ask_grownup: dpAskGrownup as DecisionPoint,
};

export function getScene(id: string): Scene | undefined {
  return SCENES[id];
}

export function getDecisionPoint(id: string): DecisionPoint | undefined {
  return DECISION_POINTS[id];
}

/** Dialogs shown by `openDialog` stage objects (`content/chapters/<ch>/dlg_*.json`). */
export const DIALOGS: Record<string, DialogRecord> = {
  dlg_meadow_welcome: dlgMeadowWelcome as DialogRecord,
  dlg_star_legend: dlgStarLegend as DialogRecord,
  dlg_paw_prints: dlgPawPrints as DialogRecord,
  dlg_rustling_bush: dlgRustlingBush as DialogRecord,
  dlg_windblown_hat: dlgWindblownHat as DialogRecord,
  dlg_torn_note: dlgTornNote as DialogRecord,
  dlg_worry_patch: dlgWorryPatch as DialogRecord,
  dlg_gathering_basket: dlgGatheringBasket as DialogRecord,
  dlg_welcome_bell: dlgWelcomeBell as DialogRecord,
  dlg_petals_on_wind: dlgPetalsOnWind as DialogRecord,
  dlg_memory_scroll: dlgMemoryScroll as DialogRecord,
  dlg_faded_memory_note: dlgFadedMemoryNote as DialogRecord,
  dlg_ready_crown: dlgReadyCrown as DialogRecord,
  dlg_festival_bell: dlgFestivalBell as DialogRecord,
  dlg_flower_crown: dlgFlowerCrown as DialogRecord,
  dlg_lonely_ball: dlgLonelyBall as DialogRecord,
  dlg_deer_tracks: dlgDeerTracks as DialogRecord,
  dlg_pond_edge: dlgPondEdge as DialogRecord,
  dlg_trail_stones: dlgTrailStones as DialogRecord,
  dlg_hiding_bush: dlgHidingBush as DialogRecord,
  dlg_dropped_hat: dlgDroppedHat as DialogRecord,
  dlg_flower_patch: dlgFlowerPatch as DialogRecord,
  dlg_empty_basket: dlgEmptyBasket as DialogRecord,
  dlg_broken_crown: dlgBrokenCrown as DialogRecord,
  dlg_scattered_petals: dlgScatteredPetals as DialogRecord,
  dlg_help_bell: dlgHelpBell as DialogRecord,
  dlg_bench_note: dlgBenchNote as DialogRecord,
};

export function getDialog(id: string): DialogRecord | undefined {
  return DIALOGS[id];
}

/** Level 1 — The Little Dragon Who Wouldn't Stop Guarding (ages 5–7), 3 phases */
export const GOLDEN_PATH = ["w1", "w2", "w3", "w4", "w5", "w6", "w7"];

export const CHAPTER_FINALE: Record<string, string> = {
  ch1: "e3",
  ch2: "w3",
  ch3: "w5",
  /** Phase 3 ends by walking to the w7 finish checkmark after dp_crossing. */
  ch4: "w7",
};

/**
 * Decisions that complete their chapter on a strong resolve.
 * Phase 3 (ch4) has none: after dp_crossing the player walks to the w7 checkmark.
 */
export const CHAPTER_COMPLETE_DECISION: Record<string, string> = {
  ch1: "dp_ask_grownup",
  ch2: "dp_fact_sort",
  ch3: "dp_choose_path",
};

/** Multi-step mini-games: required taps before a strong resolve */
export const MULTI_TAP_REQUIRED: Record<string, number> = {
  dp_breathe: 5,
  dp_crossing: 4,
};

/**
 * The diegetic stepping-stone path (spec §7.7): the ordered *main* scenes of each
 * chapter, one stone per scene. This is the in-world "where am I in the story" trail —
 * Start ➔ Scene 1 ➔ … ➔ Chapter Complete — rendered as stones the child walks, not a
 * HUD bar. Branch/detour scenes (ch1's e2a/e2b/e2c off the e2 decision) deliberately
 * fold onto their parent stone via `PATH_BRANCH_PARENT` so a side-quest doesn't read as
 * "a new stone appeared" — the child is still standing on the same beat of the journey.
 */
export const CHAPTER_PATHS: Record<string, string[]> = {
  ch1: ["e1", "e2", "e3"],
  ch2: ["w1", "w2", "w3"],
  ch3: ["w4", "w5"],
  ch4: ["w6", "w7"],
};

/** Detour scenes that light their parent stone rather than adding one. */
const PATH_BRANCH_PARENT: Record<string, string> = {
  e2a: "e2",
  e2b: "e2",
  e2c: "e2",
};

export function chapterPath(chapterId: string): string[] {
  return CHAPTER_PATHS[chapterId] ?? [];
}

/**
 * Which stone the child is standing on, as a 0-based index into `chapterPath`.
 * Returns -1 if the scene isn't on the chapter's main path (e.g. an unmapped scene),
 * so callers can choose to light nothing rather than guess.
 */
export function pathIndexForScene(chapterId: string, sceneId: string): number {
  const stone = PATH_BRANCH_PARENT[sceneId] ?? sceneId;
  return chapterPath(chapterId).indexOf(stone);
}
