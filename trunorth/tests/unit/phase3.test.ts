import { describe, it, expect } from "vitest";
import { scoreTypedResponse, TYPED_RUBRICS } from "../../src/counselor/typedScoring.js";
import { getDecisionPoint } from "../../src/content/index.js";

describe("Phase 3 — rubric-based typed scoring", () => {
  it("keeps generic behavior when no rubric applies", () => {
    expect(scoreTypedResponse("we can do it together").band).toBe("strong");
    expect(scoreTypedResponse("just hurry up already").band).toBe("poor");
    expect(scoreTypedResponse("the sky is blue today").band).toBe("partial");
  });

  it("scores inclusion answers by decision-specific signals", () => {
    expect(scoreTypedResponse("you can play with us!", "inclusion").band).toBe("strong");
    expect(scoreTypedResponse("come sit with me", "inclusion").band).toBe("strong");
    const poor = scoreTypedResponse("ignore them and keep playing", "inclusion");
    expect(poor.band).toBe("poor");
    expect(poor.matchedCriterion).toBeTruthy();
  });

  it("rewards curious questions and flags fighting the worry", () => {
    expect(scoreTypedResponse("what if it turns out okay?", "curiosity").band).toBe("strong");
    expect(scoreTypedResponse("I wonder why that happens", "curiosity").band).toBe("strong");
    expect(scoreTypedResponse("just yank the flower out", "curiosity").band).toBe("poor");
  });

  it("rewards validating a brave start and flags dismissiveness", () => {
    expect(scoreTypedResponse("I hear you Flicker, let's go", "brave_start").band).toBe("strong");
    expect(scoreTypedResponse("stop worrying, no big deal", "brave_start").band).toBe("poor");
  });

  it("lets strong signals win over poor ones and reports the criterion", () => {
    // "together" (strong) present alongside "hurry" (poor) → strong wins.
    const s = scoreTypedResponse("hurry, but we go together", "brave_start");
    expect(s.band).toBe("strong");
    expect(s.matchedCriterion).toBeTruthy();
    expect(s.confidence).toBeGreaterThan(0.6);
  });

  it("falls back to the generic base for an unknown rubric id", () => {
    expect(scoreTypedResponse("we can do it together", "no_such_rubric").band).toBe("strong");
  });

  it("wires every typed DP to an existing rubric via typedRubricRef", () => {
    const typedDps = ["dp_leftout_bench", "dp_quest_start", "dp_investigate"];
    for (const id of typedDps) {
      const dp = getDecisionPoint(id)!;
      expect(dp.inputMode).toBe("both");
      expect(dp.typedRubricRef, `${id} has a typedRubricRef`).toBeTruthy();
      expect(TYPED_RUBRICS[dp.typedRubricRef!], `${id} rubric registered`).toBeTruthy();
    }
  });
});
