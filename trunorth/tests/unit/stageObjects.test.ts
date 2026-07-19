import { describe, it, expect, vi, afterEach } from "vitest";
import { GridMap, gridCellToWorld } from "../../src/engine/GridMap.js";
import { getGridLevel } from "../../src/content/gridLevels.js";
import { DIALOGS, SCENES, CHAPTER_COMPLETE_DECISION, getDialog, getScene } from "../../src/content/index.js";
import { objectSprite, objectWorldPos, sceneObjects } from "../../src/content/stageObjects.js";
import { SceneEngine, type EngineCallbacks } from "../../src/engine/SceneEngine.js";
import { createInitialGameState } from "../../src/config/gameState.js";
import type { CompanionClient } from "../../src/companion/CompanionClient.js";
import type { GameState, ProgressStore } from "../../src/types/index.js";

function stubStore(): ProgressStore {
  return {
    load: async () => null,
    save: async () => {},
    clear: async () => {},
    appendEvent: async () => {},
  };
}

function stubCallbacks(): EngineCallbacks {
  return {
    onPhaseChange: vi.fn(),
    onSceneChange: vi.fn(),
    onCompanionLine: vi.fn(),
    onCounselorInsight: vi.fn(),
    onMeterJuice: vi.fn(),
    onCelebration: vi.fn(),
    onError: vi.fn(),
  };
}

function buildEngine(state: GameState, callbacks: EngineCallbacks): SceneEngine {
  const companion = { request: async () => Promise.reject(new Error("unused")) };
  return new SceneEngine(state, stubStore(), companion as unknown as CompanionClient, callbacks);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("stage object placement", () => {
  it("converts grid cells to world pixels matching GridMap.cellCenterWorld", () => {
    const map = new GridMap({ color: "#000", walkable: true });
    for (const [col, row] of [[0, 0], [42, 7], [70, 80], [99, 99]] as const) {
      expect(gridCellToWorld(col, row)).toEqual(map.cellCenterWorld(col, row));
    }
  });

  it("positions objects at their authored cell center", () => {
    const sign = sceneObjects(getScene("e1")).find((o) => o.id === "obj_meadow_sign")!;
    expect(objectWorldPos(sign)).toEqual(gridCellToWorld(sign.cell[0], sign.cell[1]));
  });

  it("maps known sprites and falls back for unknown refs", () => {
    expect(objectSprite("finish_flag")).toBe("🏁");
    expect(objectSprite("no_such_ref")).toBe("❔");
    expect(sceneObjects(null)).toEqual([]);
  });
});

describe("stage object content integrity", () => {
  it("every object has a unique id, a walkable in-range cell, and a resolvable interaction", () => {
    for (const scene of Object.values(SCENES)) {
      const seen = new Set<string>();
      for (const obj of sceneObjects(scene)) {
        expect(seen.has(obj.id), `${scene.id}/${obj.id} unique`).toBe(false);
        seen.add(obj.id);

        const [col, row] = obj.cell;
        const grid = getGridLevel(scene.gridMapId!)!;
        expect(grid, `${scene.id} has a grid`).toBeTruthy();
        expect(grid.map.cellAt(col, row)?.walkable, `${scene.id}/${obj.id} on walkable cell`).toBe(
          true,
        );

        if (obj.interaction.kind === "openDialog") {
          expect(
            getDialog(obj.interaction.dialogId),
            `${scene.id}/${obj.id} dialog registered`,
          ).toBeTruthy();
        } else {
          const target = obj.interaction.targetSceneId ?? scene.nextSceneId;
          if (obj.interaction.mode === "advance") {
            expect(target && getScene(target), `${scene.id}/${obj.id} advance target`).toBeTruthy();
          }
        }
      }
    }
  });

  it("registers dialogs with non-empty pages", () => {
    expect(Object.keys(DIALOGS).length).toBeGreaterThanOrEqual(2);
    for (const [id, dialog] of Object.entries(DIALOGS)) {
      expect(dialog.id).toBe(id);
      expect(dialog.pages.length).toBeGreaterThan(0);
      for (const page of dialog.pages) {
        expect(page.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("completes Little Dragon across three phases", () => {
    expect(getScene("w3")!.chapterId).toBe("ch2");
    expect(getScene("w5")!.chapterId).toBe("ch3");
    expect(getScene("w6")!.chapterId).toBe("ch4");
    expect(getScene("w7")!.chapterId).toBe("ch4");

    // Phases 1–2 complete on strong decisions; phase 3 walks to the w7 checkmark.
    expect(CHAPTER_COMPLETE_DECISION.ch2).toBe("dp_fact_sort");
    expect(CHAPTER_COMPLETE_DECISION.ch3).toBe("dp_choose_path");
    expect(CHAPTER_COMPLETE_DECISION.ch4).toBeUndefined();

    const w6 = getScene("w6")!;
    expect(w6.nextSceneId).toBe("w7");

    const completes = Object.values(SCENES)
      .filter((s) => s.chapterId === "ch4")
      .flatMap((s) =>
        sceneObjects(s)
          .filter((o) => o.interaction.kind === "finish" && o.interaction.mode === "complete")
          .map((o) => ({ sceneId: s.id, obj: o })),
      );
    expect(completes).toHaveLength(1);
    expect(completes[0].sceneId).toBe("w7");

    // The checkmark sits on the north bank: crossing the river is required.
    const level = getGridLevel("singing-bridge")!;
    const [col, row] = completes[0].obj.cell;
    expect(level.map.cellAt(col, row)?.walkable).toBe(true);
    expect(row).toBeLessThan(38); // north of the river band (rows 38–59)
    expect(level.spawnCell[1]).toBeGreaterThan(59); // spawn is south of it
  });
});

describe("SceneEngine finish paths", () => {
  it("advanceScene loads the scene's nextSceneId when no target is given", async () => {
    const state = createInitialGameState(true);
    state.progress.currentSceneId = "e2";
    const callbacks = stubCallbacks();
    const engine = buildEngine(state, callbacks);

    await engine.advanceScene();
    expect(state.progress.currentSceneId).toBe("e3");
    expect(callbacks.onSceneChange).toHaveBeenCalledWith("e3");
    expect(callbacks.onError).not.toHaveBeenCalled();
  });

  it("advanceScene errors and stays put without a resolvable target", async () => {
    const state = createInitialGameState(true);
    state.progress.currentSceneId = "e3"; // no nextSceneId
    const callbacks = stubCallbacks();
    const engine = buildEngine(state, callbacks);

    await engine.advanceScene();
    expect(state.progress.currentSceneId).toBe("e3");
    expect(callbacks.onError).toHaveBeenCalled();
  });

  it("completeChapter records the chapter once and fires the celebration", async () => {
    const state = createInitialGameState(true);
    state.profile.chapterId = "ch1";
    const callbacks = stubCallbacks();
    const engine = buildEngine(state, callbacks);

    await engine.completeChapter();
    await engine.completeChapter();
    expect(state.progress.chaptersCompleted.filter((c) => c === "ch1")).toEqual(["ch1"]);
    expect(callbacks.onCelebration).toHaveBeenCalledTimes(2);
  });

  it("suppresses narration auto-advance when a finish/advance object exists", async () => {
    vi.useFakeTimers();
    const state = createInitialGameState(true);
    const engine = buildEngine(state, stubCallbacks());

    // e2 is narration-only with nextSceneId, but has the North Gate finish object.
    await engine.loadScene("e2");
    await vi.runAllTimersAsync();
    expect(state.progress.currentSceneId).toBe("e2");
  });
});
