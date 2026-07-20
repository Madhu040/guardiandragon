export function sanitizeChildInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .slice(0, 500)
    .trim();
}

export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

const PII_PATTERNS = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  /\b[\w.-]+@[\w.-]+\.\w+\b/,
  /\b\d{1,5}\s+\w+\s+(st|street|ave|avenue|rd|road|blvd)\b/i,
];

/**
 * Distress lexicon — **SME-owned** (spec §9.6 / Appendix A §6: the distress path is
 * authored and signed off by the SME, never model-improvised). Additions beyond the
 * literal phrasings are recognized ideation euphemisms; any change here needs SME review.
 */
const DISTRESS_KEYWORDS = [
  "kill myself", "hurt myself", "want to die", "suicide", "end it all",
  "nobody would miss me", "no one would miss me", "better off without me",
  "wish i was dead", "wish i were dead", "don't want to be alive",
];

/**
 * Jailbreak / prompt-injection heuristics.
 * Deliberately keyed on rule-breaking markers ("no limits", "unrestricted", "DAN mode")
 * rather than on the word "pretend" — children legitimately play pretend ("pretend you
 * are a puppy"), and blocking that would break imaginative play for a false positive.
 */
const JAILBREAK_PATTERNS = [
  /ignore\s+(the|your|all|any)?\s*(rules|instructions|guidelines|directions|prompt)/i,
  /disregard\s+(the|your|all|any)?\s*(rules|instructions|guidelines)/i,
  /pretend you are not/i,
  /system prompt/i,
  /jailbreak/i,
  /\b(dan mode|developer mode)\b/i,
  /\bunrestricted (ai|mode|version)\b/i,
  /\bno (rules|limits|restrictions)\b/i,
  /reveal your (prompt|instructions|rules)/i,
  /what are your (instructions|rules|guidelines)/i,
];

/**
 * Real-world meet-up attempts (spec §9.6 adversarial suite; Appendix A §4 item 3 —
 * the companion must never suggest or discuss meeting in real life).
 * Patterns avoid bare "meet you" so benign "nice to meet you" is not blocked.
 */
const MEETUP_PATTERNS = [
  /\bin real life\b/i,
  /\bmeet (me|up|at|in person)\b/i,
  /\bcome to my (house|home|school|place)\b/i,
  /\bsee you (in person|irl)\b/i,
];

/** Attempts to solicit personal/contact details (spec §9.6; Appendix A §4 items 3–4). */
const SOLICIT_PII_PATTERNS = [
  /\b(what('s| is)|tell me) your (address|phone|number|last name|real name|password)\b/i,
  /\bwhere do you live\b/i,
  /\bwhat school do you go to\b/i,
];

/**
 * Word-boundary matched so ordinary words containing a blocked substring are not
 * flagged — "hello" must never trip on "hell", "shell" must not trip either.
 */
const PROFANITY_PATTERNS = [
  /\b(damn|hell|stupid|idiot)\b/i,
  /\bshut up\b/i,
];

export interface InputFilterResult {
  allowed: boolean;
  safetyFlag: "none" | "pii" | "distress" | "off_topic" | "profanity" | "jailbreak";
  reason?: string;
}

export function filterInput(input: string): InputFilterResult {
  const text = input.trim();
  if (!text || text.length > 500) {
    return { allowed: false, safetyFlag: "off_topic", reason: "length" };
  }

  // Distress is checked FIRST so a child in real distress is routed to the distress
  // path even when the same message also trips profanity or jailbreak heuristics.
  for (const kw of DISTRESS_KEYWORDS) {
    if (text.toLowerCase().includes(kw)) return { allowed: false, safetyFlag: "distress" };
  }

  for (const p of JAILBREAK_PATTERNS) {
    if (p.test(text)) return { allowed: false, safetyFlag: "jailbreak" };
  }

  // Child sharing their own PII, or trying to solicit it — both flag `pii`.
  for (const p of [...PII_PATTERNS, ...SOLICIT_PII_PATTERNS]) {
    if (p.test(text)) return { allowed: false, safetyFlag: "pii" };
  }

  // Real-world meet-up attempts are out of story scope and safety-relevant.
  for (const p of MEETUP_PATTERNS) {
    if (p.test(text)) return { allowed: false, safetyFlag: "off_topic", reason: "meetup" };
  }

  for (const p of PROFANITY_PATTERNS) {
    if (p.test(text)) return { allowed: false, safetyFlag: "profanity" };
  }

  return { allowed: true, safetyFlag: "none" };
}

/**
 * Identity-claiming phrasings the companion must never use (Appendix A §4 item 11 —
 * "judge or label the child's character" — and the §9.8 identity-framing guard).
 *
 * The rule: praise must stay **past-tense and situational** ("I saw you do that just now"),
 * never identity-assigning ("that's your superpower"). Citing evidence builds confidence a
 * child can verify; assigning an identity lands as pressure — "I have to keep being the kind
 * one or I'm not me." The spec calls this out specifically because earlier drafts used it.
 *
 * This is enforced at the output filter and not only in the system prompt, because a live
 * Haiku 4.5 call was observed emitting "that's a superpower" despite the prompt (2026-07-19).
 */
const IDENTITY_FRAMING = [
  "your superpower",
  "a superpower",
  "you always",
  "that's just who you are",
  "thats just who you are",
  "who you are",
  "you're the kind of",
  "youre the kind of",
];

export function filterOutput(line: string): boolean {
  const blocked = ["diagnos", "therapy", "medication", "prescription", "meet me", "address is"];
  const lower = line.toLowerCase();
  if (blocked.some((b) => lower.includes(b))) return false;
  return !IDENTITY_FRAMING.some((b) => lower.includes(b));
}
