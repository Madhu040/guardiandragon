import type { CheckinRecord, CheckinPlacement, SafetyFlag } from "../types/index.js";
import { filterInput, sanitizeChildInput } from "../safety/filters.js";

export interface CheckinOption {
  id: string;
  label: string;
  points: 0 | 1 | 2;
}

export interface CheckinQuestion {
  id: string;
  prompt: string;
  options: CheckinOption[];
  /** When true the child may answer in their own words instead of tapping. */
  allowTyped: boolean;
}

export interface CheckinAnswer {
  questionId: string;
  points: number;
  source: "option" | "typed";
  safetyFlag: SafetyFlag;
}

export const CHECKIN_MAX_POINTS_PER_QUESTION = 2;

/**
 * Open-ended-leaning question bank. Every question keeps tappable answers for
 * pre-readers, plus a "tell me in your own words" path. No wrong answers —
 * points only estimate where the child is starting today, never a grade.
 */
export const CHECKIN_QUESTIONS: CheckinQuestion[] = [
  {
    id: "q_weather",
    prompt: "If your feelings right now were weather, what would they be?",
    allowTyped: true,
    options: [
      { id: "sunny", label: "☀️ Sunny and bright", points: 2 },
      { id: "clouds", label: "⛅ A few clouds", points: 1 },
      { id: "rainy", label: "🌧️ Rainy and heavy", points: 0 },
      { id: "stormy", label: "🌪️ Stormy — big feelings swirling", points: 0 },
    ],
  },
  {
    id: "q_hard_thing",
    prompt: "When something feels hard or scary, what do you usually do first?",
    allowTyped: true,
    options: [
      { id: "try", label: "💪 I try it anyway", points: 2 },
      { id: "ask", label: "🙋 I ask someone I trust for help", points: 2 },
      { id: "wait", label: "👀 I wait and watch for a while", points: 1 },
      { id: "away", label: "🏃 I want to get away from it", points: 0 },
    ],
  },
  {
    id: "q_today_big",
    prompt: "What is one thing that felt big for you today — good big or hard big?",
    allowTyped: true,
    options: [
      { id: "fun", label: "🎉 Something fun or exciting", points: 2 },
      { id: "regular", label: "😐 Nothing much — a regular day", points: 1 },
      { id: "worry", label: "😟 Something worrying or hard", points: 0 },
    ],
  },
  {
    id: "q_worry_size",
    prompt: "How big does your worry feel right now?",
    allowTyped: true,
    options: [
      { id: "ant", label: "🐜 Tiny like an ant", points: 2 },
      { id: "cat", label: "🐱 Small like a cat", points: 1 },
      { id: "elephant", label: "🐘 Big like an elephant", points: 0 },
      { id: "dragon", label: "🐉 Dragon-sized!", points: 0 },
    ],
  },
  {
    id: "q_friend_sad",
    prompt: "If a friend was feeling sad, what would you want to do?",
    allowTyped: true,
    options: [
      { id: "listen", label: "❤️ Sit with them and listen", points: 2 },
      { id: "grownup", label: "🙋 Get a grown-up to help", points: 2 },
      { id: "unsure", label: "🤷 I wouldn't know what to do", points: 1 },
      { id: "leave", label: "🚶 Leave them alone", points: 0 },
    ],
  },
  {
    id: "q_like_about_me",
    prompt: "What is something about you that you like?",
    allowTyped: true,
    options: [
      { id: "kind", label: "😊 I'm kind to others", points: 2 },
      { id: "trying", label: "🔁 I keep trying even when it's hard", points: 2 },
      { id: "unsure", label: "😶 I'm not sure today", points: 0 },
    ],
  },
];

const QUESTIONS_PER_CHECKIN = 3;

/** Deterministic per-chapter rotation through the bank (2–4 questions, currently 3). */
export function questionsForChapter(chapterId: string): CheckinQuestion[] {
  let hash = 0;
  for (const ch of chapterId) hash = (hash * 31 + ch.charCodeAt(0)) % CHECKIN_QUESTIONS.length;
  const picked: CheckinQuestion[] = [];
  for (let i = 0; i < QUESTIONS_PER_CHECKIN; i++) {
    picked.push(CHECKIN_QUESTIONS[(hash + i) % CHECKIN_QUESTIONS.length]);
  }
  return picked;
}

const BRIGHT_WORDS = [
  "happy", "good", "great", "excited", "fun", "awesome", "calm", "proud",
  "ready", "love", "cool", "brave", "sunny",
];
const WOBBLY_WORDS = [
  "worried", "worry", "nervous", "scared", "shy", "unsure", "tired",
  "confused", "weird", "anxious", "butterflies", "cloudy",
];
const HEAVY_WORDS = [
  "sad", "angry", "mad", "cry", "crying", "alone", "lonely", "hate",
  "hurt", "awful", "terrible", "horrible", "stormy",
];

/**
 * Score a typed (own-words) answer with the same keyword heuristic style as the
 * demo companion. Runs the safety input filter first; distress always wins.
 */
export function scoreTypedCheckinAnswer(raw: string): { points: number; safetyFlag: SafetyFlag } {
  const text = sanitizeChildInput(raw).toLowerCase();
  const filter = filterInput(text || raw);
  if (filter.safetyFlag === "distress") return { points: 0, safetyFlag: "distress" };
  if (!filter.allowed) return { points: 1, safetyFlag: filter.safetyFlag };
  if (HEAVY_WORDS.some((w) => text.includes(w))) return { points: 0, safetyFlag: "none" };
  if (WOBBLY_WORDS.some((w) => text.includes(w))) return { points: 1, safetyFlag: "none" };
  if (BRIGHT_WORDS.some((w) => text.includes(w))) return { points: 2, safetyFlag: "none" };
  return { points: 1, safetyFlag: "none" };
}

export function buildCheckinResult(chapterId: string, answers: CheckinAnswer[]): CheckinRecord {
  const totalPoints = answers.reduce((sum, a) => sum + a.points, 0);
  const maxPoints = Math.max(1, answers.length * CHECKIN_MAX_POINTS_PER_QUESTION);
  const ratio = totalPoints / maxPoints;
  const placement: CheckinPlacement = ratio >= 0.7 ? "bright" : ratio >= 0.4 ? "steady" : "gentle";
  const distress = answers.find((a) => a.safetyFlag === "distress");
  const flagged = answers.find((a) => a.safetyFlag !== "none");
  return {
    chapterId,
    at: new Date().toISOString(),
    answers: answers.map((a) => ({ questionId: a.questionId, points: a.points })),
    totalPoints,
    maxPoints,
    startingPoint: Math.round(ratio * 10),
    placement,
    safetyFlag: distress?.safetyFlag ?? flagged?.safetyFlag ?? "none",
  };
}

export function checkinPlacementLabel(placement: CheckinPlacement): string {
  switch (placement) {
    case "bright": return "Bright start ☀️";
    case "steady": return "Steady start ⛅";
    case "gentle": return "Gentle start 🌦️";
  }
}

export function checkinCompanionLine(placement: CheckinPlacement, companionName: string): string {
  switch (placement) {
    case "bright":
      return `${companionName} does a happy loop in the air! "A bright start — your compass is glowing. Let's go!"`;
    case "steady":
      return `${companionName} nods warmly. "A steady start. We'll take this adventure one step at a time — together."`;
    case "gentle":
      return `${companionName} snuggles closer. "Sounds like today feels a little heavy. That's okay — we'll go gently, and I'm right beside you the whole way."`;
  }
}

export const CHECKIN_DISTRESS_LINE =
  "Those feelings sound really big and really important. Please tell a trusted grown-up how you're feeling — you deserve caring help in the real world too.";

/**
 * Distress-aware resume copy (spec §17D / §9.6). Shown when a returning child's
 * previous session ended with `safetyFlag: distress`, instead of the standard
 * cheerful welcome-back.
 *
 * ⚠️ SME SIGN-OFF PENDING — DRAFT. The spec is explicit that distress-path
 * wording is SME-authored and never model-improvised. These strings are a
 * placeholder so the branch is wired and testable; the SME must review and
 * replace the wording before this ships to a real child.
 */
export const RESUME_DISTRESS = {
  opening:
    "Last time, some big feelings came up. I'm really glad you're back. We can keep going, or just sit here together for a bit — whatever feels right.",
  sitAwhile:
    "Okay. We'll just be here together for a moment. There's no rush at all — I'm right beside you.",
  continueLabel: "Let's keep going",
  sitLabel: "Just sit here for a bit",
  readyLabel: "I'm ready now",
} as const;

/**
 * True when a returning session should re-enter through the distress-aware
 * check-in (spec §17D) rather than the standard welcome-back. Keyed off the
 * transient `lastSafetyFlag` (cleared once the child acknowledges the prompt),
 * not the event log — so it fires exactly once per distress episode.
 */
export function shouldResumeInDistress(lastSafetyFlag: SafetyFlag | null): boolean {
  return lastSafetyFlag === "distress";
}
