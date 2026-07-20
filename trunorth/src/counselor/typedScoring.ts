import type { ScoreBand } from "../types/index.js";

/**
 * Rubric-based scoring for free-typed decision-point answers.
 *
 * This is the offline / no-LLM path shared by BOTH the server
 * (`scoreLocally` in `server/routes/companion.ts`) and the demo client
 * (`DemoCompanionClient.inferBandFromInput`) so typed replies are scored the
 * same way everywhere. When an `ANTHROPIC_API_KEY` is present the server
 * prefers the model and only falls back here on timeout/parse failure.
 *
 * Design: a per-decision-point rubric (looked up by `DecisionPoint.typedRubricRef`)
 * layers extra `strong`/`poor` signal phrases on top of a GENERIC base that is the
 * union of the two hand-tuned keyword lists this module replaced — so choice-mode
 * option labels keep scoring exactly as before, while free-typed answers get
 * decision-specific nuance (inclusion language, curiosity questions, brave-start
 * validation, …). Safety filtering happens upstream of scoring, not here.
 */

export interface TypedRubric {
  /** Matches `DecisionPoint.typedRubricRef`. */
  id: string;
  /** Phrases (lowercased substrings) that signal a strong SEL choice. */
  strong: string[];
  /** Phrases that signal a poor / avoidant / dismissive choice. */
  poor: string[];
}

export interface TypedScore {
  band: ScoreBand;
  /** The phrase that decided a strong/poor band, for surfacing to callers. */
  matchedCriterion?: string;
  /** 0–1 confidence; higher when a specific rubric criterion matched. */
  confidence: number;
}

/**
 * Universal SEL signals, applied to every decision point regardless of rubric.
 * This is the exact union of the strong/poor keyword lists previously duplicated
 * in `scoreLocally` and `inferBandFromInput`, so nothing that scored strong/poor
 * before can regress to partial.
 */
const GENERIC: TypedRubric = {
  id: "generic",
  strong: [
    "scared", "together", "okay", "feel", "breath", "invite",
    "room for", "room for you", "check in", "rematch", "first step",
  ],
  poor: [
    "just", "hurry", "already", "dramatic", "pretend",
    "don't tell", "ruined", "don't play",
  ],
};

/** Per-decision-point rubrics, keyed by `typedRubricRef`. */
export const TYPED_RUBRICS: Record<string, TypedRubric> = {
  // ch1 dp_leftout_bench — noticing a peer who is left out and offering belonging.
  inclusion: {
    id: "inclusion",
    strong: [
      "join", "play with", "come play", "want to play", "you can play",
      "sit with", "welcome", "include", "with us", "come with", "our game",
    ],
    poor: [
      "ignore", "didn't notice", "not my problem", "go away",
      "leave them", "keep playing", "who cares", "not my friend",
    ],
  },
  // ch2 dp_quest_start — inviting the anxious guardian along instead of banishing it.
  brave_start: {
    id: "brave_start",
    strong: [
      "hear you", "i hear", "with you", "let's go", "we can", "by your side",
      "i'm with", "understand", "brave", "come along", "you're welcome", "not alone",
    ],
    poor: [
      "stop worrying", "calm down", "no big deal", "stop being",
      "don't be scared", "get over it", "go home", "stay behind",
    ],
  },
  // ch2 dp_investigate — meeting worry with a curious question, not a fight.
  curiosity: {
    id: "curiosity",
    strong: [
      "?", "what if", "what makes", "why", "how", "wonder",
      "curious", "find out", "what would", "maybe", "let's ask", "learn",
    ],
    poor: [
      "shut", "stop asking", "yank", "pull it out", "fight",
      "get rid", "make it stop", "destroy", "rip it",
    ],
  },
};

function firstMatch(text: string, phrases: string[]): string | undefined {
  for (const p of phrases) {
    if (text.includes(p)) return p;
  }
  return undefined;
}

/**
 * Score a free-typed answer for a decision point.
 * @param input   the child's raw typed text (already safety-filtered upstream)
 * @param rubricId `DecisionPoint.typedRubricRef`, if any; falls back to GENERIC only
 */
export function scoreTypedResponse(input: string, rubricId?: string): TypedScore {
  const text = (input ?? "").toLowerCase();
  const rubric = rubricId ? TYPED_RUBRICS[rubricId] : undefined;

  // Strong takes precedence over poor (parity with the prior implementations).
  const strongHit =
    (rubric && firstMatch(text, rubric.strong)) ?? firstMatch(text, GENERIC.strong);
  if (strongHit) return { band: "strong", matchedCriterion: strongHit, confidence: 0.9 };

  const poorHit =
    (rubric && firstMatch(text, rubric.poor)) ?? firstMatch(text, GENERIC.poor);
  if (poorHit) return { band: "poor", matchedCriterion: poorHit, confidence: 0.9 };

  return { band: "partial", confidence: 0.6 };
}
