import { describe, it, expect } from "vitest";
import {
  visibleSparks,
  chapterSparkTotal,
  chapterSparksFound,
} from "../../src/content/sparks.js";
import { SCENES, DECISION_POINTS } from "../../src/content/index.js";
import { celebrationFor, contentConfig } from "../../src/config/content.js";
import { createInitialGameState } from "../../src/config/gameState.js";
import type { GameEvent, GameState, Scene } from "../../src/types/index.js";

/** Spec §7.1 / §7.6 — Kindness Sparks, the replayable micro-loop. */

const allScenes = Object.values(SCENES) as Scene[];
const ch1Scenes = allScenes.filter((s) => s.chapterId === "ch1");

function stateWith(events: Array<Partial<GameEvent>> = []): GameState {
  const state = createInitialGameState(true);
  state.eventLog = events.map((e, i) => ({
    id: `e${i}`,
    timestamp: new Date().toISOString(),
    sceneId: e.sceneId ?? "e2",
    decisionPointId: e.decisionPointId ?? "dp_leftout_bench",
    scoreBand: e.scoreBand ?? "strong",
    safetyFlag: "none",
    ...e,
  })) as GameEvent[];
  return state;
}

describe("Kindness Sparks — there is something to DO before the decision", () => {
  it("gives Chapter 1 real collectibles, not a single token one", () => {
    // The regression this guards: ch1 shipped with ONE collectible across six scenes, so
    // every scene was walk-to-trigger -> answer -> next. That is a quiz, not a world.
    const total = chapterSparkTotal(allScenes, "ch1");
    expect(total).toBeGreaterThanOrEqual(8);

    // And they are spread across scenes, not piled into one.
    const scenesWithSparks = ch1Scenes.filter((s) => s.collectibles.length > 0);
    expect(scenesWithSparks.length).toBeGreaterThanOrEqual(5);
  });

  it("hides gated sparks until the kind action actually happens", () => {
    const gatedScene = ch1Scenes.find((s) => s.collectibles.some((c) => c.gate));
    expect(gatedScene, "no scene has a gated spark").toBeDefined();

    const gated = gatedScene!.collectibles.find((c) => c.gate)!;
    const before = visibleSparks(gatedScene!, stateWith());
    expect(before.map((c) => c.id)).not.toContain(gated.id);

    const after = visibleSparks(
      gatedScene!,
      stateWith([{ decisionPointId: gated.gate!, scoreBand: "strong" }]),
    );
    expect(after.map((c) => c.id)).toContain(gated.id);
  });

  it("does not unlock a gated spark on a poor choice — kindness is the key", () => {
    const gatedScene = ch1Scenes.find((s) => s.collectibles.some((c) => c.gate))!;
    const gated = gatedScene.collectibles.find((c) => c.gate)!;
    const visible = visibleSparks(
      gatedScene,
      stateWith([{ decisionPointId: gated.gate!, scoreBand: "poor" }]),
    );
    expect(visible.map((c) => c.id)).not.toContain(gated.id);
  });

  it("every gate points at a real decision point", () => {
    for (const scene of allScenes) {
      for (const c of scene.collectibles) {
        if (!c.gate) continue;
        expect(DECISION_POINTS[c.gate], `${c.id} gates on unknown DP ${c.gate}`).toBeDefined();
      }
    }
  });

  /**
   * §7.6's hard constraint: "chasing sparks is never required to progress". A child who
   * ignores every spark must still finish the chapter.
   */
  it("never gates story progress behind a spark", () => {
    for (const scene of allScenes) {
      const advancesVia = scene.nextSceneId || scene.decisionPoints.length > 0 || (scene.objects?.length ?? 0) > 0;
      expect(advancesVia, `${scene.id} has no way forward independent of collectibles`).toBeTruthy();
    }
  });

  it("counts only the sparks found in this chapter", () => {
    const state = stateWith();
    state.progress.kindnessSparksFound = {
      e1: ["spark_e1_a"],
      e2: ["spark_e2"],
      w1: ["spark_w1_somewhere"], // a ch2 scene — must not leak into the ch1 tally
    };
    expect(chapterSparksFound(allScenes, "ch1", state)).toBe(2);
  });
});

/**
 * Spec §7.1 — "brownie points scattered for immediate, low-stakes fun". Crystals make
 * *moving through the world* rewarding, which is a different job from the §7.6 sparks.
 * They must stay out of the spark tally: inflating the "found 4 of 6" denominator with
 * dozens of freebies would destroy the "find what I missed" signal that drives replay.
 */
describe("Crystals — scattered pickups that never pollute the spark tally", () => {
  it("scatters crystals to walk over in every scene", () => {
    for (const scene of allScenes) {
      const crystals = scene.collectibles.filter((c) => c.kind === "crystal");
      expect(crystals.length, `${scene.id} should have crystals to collect`).toBeGreaterThan(0);
    }
  });

  it("never gates a crystal — they are free fun on the way", () => {
    for (const scene of allScenes) {
      for (const c of scene.collectibles.filter((x) => x.kind === "crystal")) {
        expect(c.gate, `${scene.id}/${c.id} must not be gated`).toBeUndefined();
      }
    }
  });

  it("excludes crystals from the chapter spark total", () => {
    for (const chapterId of ["ch1", "ch2"]) {
      const scenes = allScenes.filter((s) => s.chapterId === chapterId);
      const sparkCount = scenes.reduce(
        (n, s) => n + s.collectibles.filter((c) => c.kind === "kindness_spark").length,
        0,
      );
      const allCount = scenes.reduce((n, s) => n + s.collectibles.length, 0);
      expect(chapterSparkTotal(allScenes, chapterId)).toBe(sparkCount);
      // Guard the point of the test: there really are crystals inflating the raw count.
      expect(allCount).toBeGreaterThan(sparkCount);
    }
  });

  it("does not count a collected crystal as a found spark", () => {
    const state = stateWith();
    const e1 = allScenes.find((s) => s.id === "e1")!;
    const crystal = e1.collectibles.find((c) => c.kind === "crystal")!;
    state.progress.kindnessSparksFound = { e1: [crystal.id] };
    expect(chapterSparksFound(allScenes, "ch1", state)).toBe(0);
  });
});

describe("Celebration copy matches the chapter the child actually played", () => {
  it("gives Chapter 1 its own copy, not Chapter 2's", () => {
    const ch1 = celebrationFor("ch1");
    const ch2 = celebrationFor("ch2");
    expect(ch1).not.toEqual(ch2);

    // The bug: finishing ch1 (Jamie, sharing, apologising, asking a grown-up) congratulated
    // the child for inspecting a worry-flower and taking festival steps — none of which
    // happened, about a character who wasn't in the chapter.
    const ch1Text = JSON.stringify(ch1).toLowerCase();
    expect(ch1Text).not.toContain("worry-flower");
    expect(ch1Text).not.toContain("festival");
    expect(ch1Text).toContain("jamie");
  });

  it("keeps Chapter 2's original copy intact", () => {
    const ch2 = celebrationFor("ch2");
    expect(ch2.achievements).toContain("Inspected a worry-flower");
    expect(ch2.trophyLabel).toContain("Star Crystal");
  });

  it("falls back to the showcase chapter for an unknown id", () => {
    expect(celebrationFor("ch_nonexistent")).toEqual(contentConfig.celebrations.ch2);
  });

  it("has one achievement line per authored chapter", () => {
    for (const [id, cfg] of Object.entries(contentConfig.celebrations)) {
      expect(cfg.achievements.length, `${id} has too few achievements`).toBeGreaterThanOrEqual(4);
      expect(cfg.companionLesson.length, `${id} companion lesson is empty`).toBeGreaterThan(10);
    }
  });
});
