import { describe, it, expect } from "vitest";
import {
  isSfxEnabled,
  isSfxSupported,
  sfxForBand,
  unlockAudioOnFirstGesture,
} from "../../src/audio/sfx.js";

/**
 * Spec §17B.4 — event-mapped SFX + a low-energy ambient bed.
 *
 * Vitest here runs in a Node environment (no DOM/Audio), which is itself a real
 * assertion: the module must degrade to "unsupported, do nothing" rather than throw
 * when `window`/`Audio` don't exist — the same contract the offline demo depends on
 * when a browser blocks or lacks audio.
 */
describe("sfx (spec §17B.4)", () => {
  it("reports unsupported and disabled outside a browser, without throwing", () => {
    expect(isSfxSupported()).toBe(false);
    expect(isSfxEnabled()).toBe(false);
  });

  it("maps strong -> a bright cue and poor -> a thud, the two spec-named examples", () => {
    expect(sfxForBand("strong")).toBe("decision_strong");
    expect(sfxForBand("poor")).toBe("decision_thud");
  });

  it("gives partial no cue of its own — the consequence copy already carries that beat", () => {
    expect(sfxForBand("partial")).toBeNull();
  });

  it("the mobile audio-unlock hook degrades to a no-op outside a browser, without throwing", () => {
    expect(() => unlockAudioOnFirstGesture()).not.toThrow();
  });
});
