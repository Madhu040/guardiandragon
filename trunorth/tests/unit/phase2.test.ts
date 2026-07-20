import { describe, it, expect } from "vitest";
import { DecisionResolver } from "../../src/engine/DecisionResolver.js";
import { createInitialGameState } from "../../src/config/gameState.js";
import { DECISION_POINTS, SCENES, getDecisionPoint } from "../../src/content/index.js";
import { insightForStep } from "../../src/counselor/insights.js";
import { discussPrompt } from "../../src/counselor/coPlay.js";

describe("Phase 2 — typed input in the Little Dragon level", () => {
  it("promotes dp_quest_start and dp_investigate to accept typed replies", () => {
    expect(getDecisionPoint("dp_quest_start")!.inputMode).toBe("both");
    expect(getDecisionPoint("dp_investigate")!.inputMode).toBe("both");
  });

  it("still exposes tap options on the promoted 'both' DPs", () => {
    for (const id of ["dp_quest_start", "dp_investigate"]) {
      const dp = getDecisionPoint(id)!;
      expect(dp.inputMode).toBe("both");
      expect(dp.options?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("advances the Little Dragon story on any typed band (no dead-ends on promoted DPs)", () => {
    const resolver = new DecisionResolver();
    // Every band on dp_quest_start advances w1 -> w2 (never strands a typed reply).
    for (const band of ["strong", "partial", "poor"] as const) {
      const { nextSceneId } = resolver.applyConsequence(
        createInitialGameState(),
        getDecisionPoint("dp_quest_start")!,
        band,
      );
      expect(nextSceneId).toBe("w2");
    }
  });
});

describe("Phase 2 — widened ch1 (Everbright Meadow) interaction curve", () => {
  const CH1_SCENES = ["e1", "e2", "e2a", "e2b", "e2c", "e3"];
  const NEW_DPS = ["dp_reassure_shy", "dp_share_flower", "dp_repair_oops"];

  it("meets the spec's 4–6 decision-point floor for the chapter", () => {
    const ch1SceneIds = new Set(CH1_SCENES);
    const ch1Dps = new Set<string>();
    for (const id of ch1SceneIds) {
      for (const dp of SCENES[id].decisionPoints) ch1Dps.add(dp);
    }
    expect(ch1Dps.size).toBeGreaterThanOrEqual(4);
    expect(ch1Dps.size).toBeLessThanOrEqual(6);
  });

  it("chains the new scenes e1 -> e2 -> e2a -> e2b -> e2c -> e3", () => {
    expect(SCENES.e2.nextSceneId).toBe("e2a");
    expect(SCENES.e2a.nextSceneId).toBe("e2b");
    expect(SCENES.e2b.nextSceneId).toBe("e2c");
    expect(SCENES.e2c.nextSceneId).toBe("e3");
    for (const id of CH1_SCENES) expect(SCENES[id].chapterId).toBe("ch1");
  });

  it("registers each new DP with three-band options and forward/repair routing", () => {
    const resolver = new DecisionResolver();
    for (const id of NEW_DPS) {
      const dp = DECISION_POINTS[id];
      expect(dp, `${id} registered`).toBeTruthy();
      const scores = new Set((dp.options ?? []).map((o) => o.selScore));
      expect(scores).toEqual(new Set(["strong", "partial", "poor"]));

      const strong = resolver.applyConsequence(createInitialGameState(), dp, "strong");
      const poor = resolver.applyConsequence(createInitialGameState(), dp, "poor");
      // Strong advances to a different scene; poor keeps the player on-scene to repair.
      expect(strong.nextSceneId).not.toBe(poor.nextSceneId);
      expect(poor.repairAction).toBeTruthy();
    }
  });

  it("provides counselor insight + co-play coverage for every new DP", () => {
    for (const id of NEW_DPS) {
      for (const band of ["strong", "partial", "poor"] as const) {
        const insight = insightForStep(id, band);
        expect(insight.forChild.length).toBeGreaterThan(20);
        expect(insight.forParent.length).toBeGreaterThan(20);
      }
      expect(discussPrompt(id).length).toBeGreaterThan(20);
    }
  });
});
