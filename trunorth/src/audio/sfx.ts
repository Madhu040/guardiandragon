/**
 * Event-mapped sound effects + a low-energy ambient bed (spec §17B.4).
 *
 * Fully on-device: pre-recorded clips shipped under `public/audio/`, no network calls, so
 * the offline demo (§13A.3) is unaffected. Every cue is optional — a missing or broken
 * file plays silence, never a crash or a console flood, mirroring the art asset manifest's
 * fallback philosophy (`src/content/assetManifest.ts`).
 *
 * §17A.4 calm-first budget: the ambient bed stays low-stimulation; reward chimes can spike
 * above it (`appConfig.sfx.ambienceVolume` << `appConfig.sfx.volume`).
 * §13A.6 mutable + venue-safe: one toggle mutes everything here, and no cue carries
 * information the visuals don't already convey (§17B.4 accessibility — never the sole
 * feedback channel).
 */

import { appConfig } from "../config/app.js";
import type { ScoreBand } from "../types/index.js";

export type SfxKey =
  | "footstep"
  | "discovery"
  | "spark_pickup"
  | "decision_strong"
  | "decision_thud"
  | "celebration";

const SFX_FILES: Record<SfxKey, string> = {
  // .wav, not .mp3 — see public/audio/README.md. The delivered clip's transient landed
  // after FOOTSTEP_INTERVAL_S, so every retrigger cut it off before it was ever audible;
  // re-trimmed to fit inside the window. No MP3 encoder was available to re-export it.
  footstep: "/audio/sfx/footstep.wav",
  discovery: "/audio/sfx/discovery.mp3",
  spark_pickup: "/audio/sfx/spark-pickup.mp3",
  decision_strong: "/audio/sfx/decision-strong.mp3",
  decision_thud: "/audio/sfx/decision-thud.mp3",
  celebration: "/audio/sfx/celebration.mp3",
};

// .wav — the delivered clip didn't loop cleanly (its start/end weren't near-silent, so the
// seam clicked every ~2s); a 150ms fade in/out was applied. See public/audio/README.md.
const AMBIENCE_FILE = "/audio/ambience/exploring-bed.wav";

const ENABLED_KEY = "trunorth_sfx_enabled";

function supported(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

export function isSfxSupported(): boolean {
  return supported();
}

export function isSfxEnabled(): boolean {
  if (!supported() || !appConfig.features.soundEffects) return false;
  const stored = localStorage.getItem(ENABLED_KEY);
  return stored === null ? true : stored === "1";
}

export function setSfxEnabled(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  if (!enabled) stopAmbience();
}

/**
 * strong -> a bright cue, poor (including a repair nudge) -> a soft comical thud — the two
 * named examples in spec §17B.4. `partial` intentionally has no cue of its own: the
 * consequence copy and companion reaction already carry that beat, and not every band
 * needs its own sting.
 */
export function sfxForBand(band: ScoreBand): SfxKey | null {
  if (band === "strong") return "decision_strong";
  if (band === "poor") return "decision_thud";
  return null;
}

const cache = new Map<SfxKey, HTMLAudioElement>();
const broken = new Set<SfxKey>();

function getClip(key: SfxKey): HTMLAudioElement | null {
  if (broken.has(key)) return null;
  let el = cache.get(key);
  if (!el) {
    el = new Audio(SFX_FILES[key]);
    el.preload = "auto";
    el.volume = appConfig.sfx.volume;
    // A 404/decode failure marks the cue broken so we stop trying — same "silence, not
    // a crash" contract the art manifest's onerror fallback uses.
    el.addEventListener("error", () => broken.add(key), { once: true });
    cache.set(key, el);
  }
  return el;
}

/** Play a one-shot event cue. Overlapping calls to the same cue restart it, not queue it. */
export function playSfx(key: SfxKey): void {
  if (!isSfxEnabled()) return;
  const el = getClip(key);
  if (!el) return;
  el.currentTime = 0;
  el.play().catch(() => {
    // Autoplay policy or a still-loading/missing file — never surface as an error.
  });
}

let ambience: HTMLAudioElement | null = null;
let ambienceBroken = false;

/** Start (or resume) the low-energy exploration bed. No-op if already playing or muted. */
export function startAmbience(): void {
  if (!isSfxEnabled() || ambienceBroken) return;
  if (!ambience) {
    ambience = new Audio(AMBIENCE_FILE);
    ambience.loop = true;
    ambience.volume = appConfig.sfx.ambienceVolume;
    ambience.addEventListener("error", () => { ambienceBroken = true; }, { once: true });
  }
  if (ambience.paused) {
    void ambience.play().catch(() => {});
  }
}

/** Pause the bed (e.g. leaving the explore phase for a decision) without losing position. */
export function stopAmbience(): void {
  ambience?.pause();
}
