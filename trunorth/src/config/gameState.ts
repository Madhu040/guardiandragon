import { appConfig } from "./app.js";
import { createDefaultMeters, type GameState } from "../types/index.js";

/** Build a fresh GameState using configurable defaults from `appConfig`. */
export function createInitialGameState(demoMode = false): GameState {
  const { defaults } = appConfig;

  return {
    version: 1,
    profile: {
      ageBand: defaults.ageBand,
      chapterId: defaults.chapterId,
      avatar: { skinTone: "tone_3", hair: "hair_curly" },
      companionName: defaults.companionName,
      companionArchetype: defaults.companionArchetype,
      baselineStrength: defaults.baselineStrength,
    },
    progress: {
      currentSceneId: defaults.startSceneId,
      chaptersUnlocked: ["ch1", "ch2"],
      chaptersCompleted: [],
      browniePoints: 0,
      kindnessSparksFound: {},
    },
    meters: createDefaultMeters(),
    companion: { level: 1, appearanceRef: "companion_dragon_base" },
    emotionalResidue: {},
    parentGate: { lastPassedChapter: null },
    flags: { demoMode, lastSafetyFlag: null, onboardingComplete: false, playMode: "solo" },
    eventLog: [],
  };
}
