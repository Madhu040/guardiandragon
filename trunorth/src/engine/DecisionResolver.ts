import type {
  DecisionPoint,
  GameEvent,
  GameState,
  ScoreBand,
  SkillId,
} from "../types/index.js";

export class DecisionResolver {
  resolveChoice(dp: DecisionPoint, optionId: string): ScoreBand {
    const option = dp.options?.find((o) => o.id === optionId);
    return option?.selScore ?? "partial";
  }

  applyConsequence(
    state: GameState,
    dp: DecisionPoint,
    band: ScoreBand,
  ): { nextSceneId: string; repairAction: string | null } {
    const consequence = dp.consequences.find((c) => c.band === band)
      ?? dp.consequences.find((c) => c.band === "partial")
      ?? dp.consequences[0];

    if (consequence.meterDeltas) {
      for (const [skill, delta] of Object.entries(consequence.meterDeltas)) {
        const meter = state.meters[skill as SkillId];
        if (meter) {
          meter.fill = Math.min(1, meter.fill + (delta as number));
          if (meter.fill >= 1) {
            meter.fill = 0;
            meter.level = Math.min(3, meter.level + 1) as 1 | 2 | 3;
          }
        }
      }
    }

    if (band === "strong") {
      state.progress.browniePoints += 1;
    }

    const event: GameEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sceneId: state.progress.currentSceneId,
      decisionPointId: dp.id,
      scoreBand: band,
      skill: dp.selSkills[0],
      safetyFlag: state.flags.lastSafetyFlag ?? "none",
    };
    state.eventLog.push(event);
    if (state.eventLog.length > 200) {
      state.eventLog = state.eventLog.slice(-200);
    }

    return {
      nextSceneId: consequence.sceneId,
      repairAction: consequence.repairAction ?? null,
    };
  }
}

export function canUsePlayfulExternalization(dp: DecisionPoint): boolean {
  return dp.themeSensitivity === "standard";
}
