/**
 * Companion voice output via the browser's built-in SpeechSynthesis API.
 *
 * Fully on-device: no audio or text leaves the browser, so the existing
 * safety/privacy posture is unchanged. Companion lines are already
 * safety-filtered before they reach the UI, and only those lines are spoken.
 */

import { appConfig } from "../config/app.js";

const ENABLED_KEY = "trunorth_voice_enabled";

let cachedVoice: SpeechSynthesisVoice | null = null;

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isVoiceEnabled(): boolean {
  if (!isSpeechSupported() || !appConfig.features.voiceOutput) return false;
  const stored = localStorage.getItem(ENABLED_KEY);
  return stored === null ? true : stored === "1";
}

export function setVoiceEnabled(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  if (!enabled) stopSpeaking();
}

/** Speak a companion line aloud, replacing any line still being spoken. */
export function speakLine(text: string): void {
  if (!isVoiceEnabled() || !text.trim()) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = appConfig.voice.rate;
  utterance.pitch = appConfig.voice.pitch;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

/**
 * Prefer a local English voice so speech works offline and stays on-device.
 * Voices load asynchronously in some browsers; until they arrive we return
 * null and the browser default is used.
 */
function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const preferredName = appConfig.voice.preferredVoice;
  cachedVoice =
    (preferredName ? voices.find((v) => v.name === preferredName) : undefined) ??
    voices.find((v) => v.lang.startsWith("en") && v.localService) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0];
  return cachedVoice;
}

if (isSpeechSupported()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
  };
}
