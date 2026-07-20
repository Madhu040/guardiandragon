import { describe, it, expect } from "vitest";
import { chapterPath, pathIndexForScene } from "../../src/content/index.js";

/**
 * Spec §7.7 — the diegetic stepping-stone path. These guard the *data* the renderer draws
 * from (the renderer itself is DOM and covered by the child-surface e2e). The one piece of
 * real logic worth pinning is branch-folding: ch1's e2a/e2b/e2c detours must light the e2
 * stone, not conjure a new one — a side-quest is the same beat of the journey.
 */
describe("progress path (spec §7.7)", () => {
  it("maps each main scene to its own stone in order", () => {
    expect(chapterPath("ch1")).toEqual(["e1", "e2", "e3"]);
    expect(pathIndexForScene("ch1", "e1")).toBe(0);
    expect(pathIndexForScene("ch1", "e2")).toBe(1);
    expect(pathIndexForScene("ch1", "e3")).toBe(2);
  });

  it("folds ch1 branch scenes onto their parent stone", () => {
    expect(pathIndexForScene("ch1", "e2a")).toBe(1);
    expect(pathIndexForScene("ch1", "e2b")).toBe(1);
    expect(pathIndexForScene("ch1", "e2c")).toBe(1);
  });

  it("covers the w-path phases (ch2/ch3/ch4)", () => {
    expect(pathIndexForScene("ch2", "w2")).toBe(1);
    expect(pathIndexForScene("ch3", "w5")).toBe(1);
    expect(pathIndexForScene("ch4", "w7")).toBe(1);
  });

  it("returns -1 for a scene not on the chapter's path, so callers light nothing", () => {
    expect(pathIndexForScene("ch1", "w1")).toBe(-1);
    expect(pathIndexForScene("ch2", "nonexistent")).toBe(-1);
  });
});
