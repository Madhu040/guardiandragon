import { describe, it, expect } from "vitest";
import { DecisionResolver } from "../../src/engine/DecisionResolver.js";
import { getDecisionPoint } from "../../src/content/index.js";
import { createInitialGameState } from "../../src/config/gameState.js";
import { insightForStep } from "../../src/counselor/insights.js";
import { shouldResumeInDistress, RESUME_DISTRESS } from "../../src/counselor/checkin.js";

describe("Ask-for-Help scored beat (spec §7.2)", () => {
  it("dp_ask_grownup sits on the Ch.1 path and scores ask_for_help as its primary skill", () => {
    const dp = getDecisionPoint("dp_ask_grownup")!;
    expect(dp).toBeDefined();
    // Primary skill drives the event-log `skill` and the meter-juice target.
    expect(dp.selSkills[0]).toBe("ask_for_help");
  });

  it("logs the resolved decision as an ask_for_help event", () => {
    const resolver = new DecisionResolver();
    const dp = getDecisionPoint("dp_ask_grownup")!;
    const state = createInitialGameState();
    resolver.applyConsequence(state, dp, "strong");
    const last = state.eventLog.at(-1)!;
    expect(last.decisionPointId).toBe("dp_ask_grownup");
    expect(last.skill).toBe("ask_for_help");
  });

  it("scores ask_for_help without a meter, yet still fills the tagged courage/empathy meters", () => {
    const resolver = new DecisionResolver();
    const dp = getDecisionPoint("dp_ask_grownup")!;
    const state = createInitialGameState();
    // ask_for_help is cross-cutting with NO meter — the resolver must not crash
    // and must leave the (nonexistent) ask_for_help meter absent.
    expect(() => resolver.applyConsequence(state, dp, "strong")).not.toThrow();
    expect((state.meters as Record<string, unknown>).ask_for_help).toBeUndefined();
    expect(state.meters.courage.fill).toBeGreaterThan(0);
    expect(state.meters.empathy.fill).toBeGreaterThan(0);
  });

  it("frames the counselor insight as ask_for_help across all bands", () => {
    for (const band of ["strong", "partial", "poor"] as const) {
      expect(insightForStep("dp_ask_grownup", band).skillFocus).toBe("ask_for_help");
    }
  });
});

describe("Distress-aware resume (spec §17D)", () => {
  it("re-enters through the distress check-in only when the last flag was distress", () => {
    expect(shouldResumeInDistress("distress")).toBe(true);
    expect(shouldResumeInDistress("none")).toBe(false);
    expect(shouldResumeInDistress(null)).toBe(false);
    expect(shouldResumeInDistress("off_topic")).toBe(false);
  });

  it("ships calm, non-empty re-entry copy with a low-pressure 'sit here' path", () => {
    expect(RESUME_DISTRESS.opening.length).toBeGreaterThan(0);
    expect(RESUME_DISTRESS.sitAwhile.length).toBeGreaterThan(0);
    // The opening offers doing-nothing as a valid choice, per §17D.
    expect(RESUME_DISTRESS.opening.toLowerCase()).toContain("sit here");
  });
});
