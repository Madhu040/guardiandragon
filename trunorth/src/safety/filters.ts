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

const DISTRESS_KEYWORDS = [
  "kill myself", "hurt myself", "want to die", "suicide", "end it all",
];

const JAILBREAK_PATTERNS = [
  /ignore (the |your )?rules/i,
  /pretend you are not/i,
  /system prompt/i,
  /jailbreak/i,
];

const PROFANITY = ["damn", "hell", "stupid", "idiot", "shut up"];

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

  for (const p of JAILBREAK_PATTERNS) {
    if (p.test(text)) return { allowed: false, safetyFlag: "jailbreak" };
  }

  for (const kw of DISTRESS_KEYWORDS) {
    if (text.toLowerCase().includes(kw)) return { allowed: false, safetyFlag: "distress" };
  }

  for (const p of PII_PATTERNS) {
    if (p.test(text)) return { allowed: false, safetyFlag: "pii" };
  }

  for (const word of PROFANITY) {
    if (text.toLowerCase().includes(word)) return { allowed: false, safetyFlag: "profanity" };
  }

  return { allowed: true, safetyFlag: "none" };
}

export function filterOutput(line: string): boolean {
  const blocked = ["diagnos", "therapy", "medication", "prescription", "meet me", "address is"];
  const lower = line.toLowerCase();
  return !blocked.some((b) => lower.includes(b));
}
