/**
 * Client-side app config.
 * Vite injects `VITE_*` vars at build time; runtime query flags can override demo mode.
 *
 * Tunables for gameplay defaults (companion name, starting chapter, timing) live here
 * so content teams can change behavior without hunting through UI/engine files.
 */

function viteString(key: keyof ImportMetaEnv | string, fallback: string): string {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const value = env[key];
  if (value === undefined || value === "") return fallback;
  return String(value);
}

function viteBool(key: string, fallback: boolean): boolean {
  const raw = viteString(key, fallback ? "true" : "false").toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

function viteNumber(key: string, fallback: number): number {
  const n = Number(viteString(key, String(fallback)));
  return Number.isFinite(n) ? n : fallback;
}

/** Static build-time / file defaults (overridable via `.env`) */
export const appConfig = {
  /** Base URL for the Hono API. Empty string = same-origin / Vite proxy. */
  apiUrl: viteString("VITE_API_URL", ""),
  /** Force demo mode even without `?demo=1`. */
  forceDemoMode: viteBool("VITE_DEMO_MODE", false),
  features: {
    parentAuth: viteBool("VITE_FEATURE_PARENT_AUTH", true),
    togetherMode: viteBool("VITE_FEATURE_TOGETHER_MODE", true),
    scenarioHub: viteBool("VITE_FEATURE_SCENARIO_HUB", true),
    /** WASD/arrow exploration with proximity interact + collectibles */
    worldMovement: viteBool("VITE_FEATURE_WORLD_MOVEMENT", true),
    /** Speak companion lines aloud via on-device SpeechSynthesis */
    voiceOutput: viteBool("VITE_FEATURE_VOICE_OUTPUT", true),
  },
  voice: {
    /** Speech rate (1 = normal). Slightly slower reads better for kids. */
    rate: viteNumber("VITE_VOICE_RATE", 0.95),
    /** Speech pitch (1 = normal). Slightly higher suits the companion. */
    pitch: viteNumber("VITE_VOICE_PITCH", 1.1),
    /** Exact system voice name to use, if available (empty = auto-pick). */
    preferredVoice: viteString("VITE_VOICE_NAME", ""),
  },
  defaults: {
    companionName: viteString("VITE_DEFAULT_COMPANION_NAME", "Flicker"),
    companionArchetype: viteString("VITE_DEFAULT_COMPANION_ARCHETYPE", "companion_dragon"),
    chapterId: viteString("VITE_DEFAULT_CHAPTER_ID", "ch2"),
    startSceneId: viteString("VITE_DEFAULT_START_SCENE", "w1"),
    ageBand: viteString("VITE_DEFAULT_AGE_BAND", "8-10") as "5-7" | "8-10" | "11-15",
    baselineStrength: viteString("VITE_DEFAULT_BASELINE_STRENGTH", "worry_brave"),
  },
  timing: {
    narrationAutoAdvanceMs: viteNumber("VITE_NARRATION_AUTO_ADVANCE_MS", 2200),
    demoCompanionDelayMs: viteNumber("VITE_DEMO_COMPANION_DELAY_MS", 350),
  },
  world: {
    /** Avatar speed in scene pixels per second (1920×1080 space). */
    moveSpeedPx: viteNumber("VITE_MOVE_SPEED", 420),
    /** Distance to start decision / NPC interact. */
    interactRadiusPx: viteNumber("VITE_INTERACT_RADIUS", 140),
    /** Companion follow smoothing (higher = stickier / slower catch-up). */
    companionFollowLag: viteNumber("VITE_COMPANION_FOLLOW_LAG", 0.88),
  },
  productName: viteString("VITE_PRODUCT_NAME", "TruNorth"),
} as const;

export type AppConfig = typeof appConfig;

/** Resolve whether this browser session is in offline demo mode. */
export function isDemoMode(search = typeof location !== "undefined" ? location.search : ""): boolean {
  return appConfig.forceDemoMode || new URLSearchParams(search).has("demo");
}
