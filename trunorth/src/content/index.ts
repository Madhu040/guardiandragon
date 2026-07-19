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
import e3 from "../../content/chapters/ch1/e3.scene.json";
import dpLeftout from "../../content/chapters/ch1/dp_leftout_bench.json";
import dpAskGrownup from "../../content/chapters/ch1/dp_ask_grownup.json";

import dlgMeadowWelcome from "../../content/chapters/ch1/dlg_meadow_welcome.json";
import dlgStarLegend from "../../content/chapters/ch2/dlg_star_legend.json";

export const SCENES: Record<string, Scene> = {
  w1: w1 as Scene,
  w2: w2 as Scene,
  w3: w3 as Scene,
  w4: w4 as Scene,
  w5: w5 as Scene,
  w6: w6 as Scene,
  w7: w7 as unknown as Scene,
  e1: e1 as Scene,
  e2: e2 as Scene,
  e3: e3 as Scene,
};

export const DECISION_POINTS: Record<string, DecisionPoint> = {
  dp_quest_start: dpQuestStart as DecisionPoint,
  dp_investigate: dpInvestigate as DecisionPoint,
  dp_fact_sort: dpFactSort as DecisionPoint,
  dp_breathe: dpBreathe as DecisionPoint,
  dp_choose_path: dpChoosePath as DecisionPoint,
  dp_crossing: dpCrossing as DecisionPoint,
  dp_leftout_bench: dpLeftout as DecisionPoint,
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
