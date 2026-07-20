/**
 * Personalise child-facing copy.
 *
 * Owner playtest: *"why can't it be like a natural conversation with the explorer or its
 * name? Make conversation real, make it as human interaction as possible."*
 *
 * The single biggest lever is that the companion never said the child's name. A line like
 * "Let's look around" is narration; "Hey Nova — come on, let's go see if they're okay" is a
 * friend talking to *you*. Authored copy carries a `{name}` token that is filled in at
 * render time from the child's onboarding name.
 *
 * Used sparingly by design — a companion that says your name in every sentence reads as
 * creepy, not warm — so only some lines carry the token.
 */

/** What we call the child when they haven't given a name (guest play). On-theme, never blank. */
const FALLBACK_NAME = "explorer";
const FALLBACK_COMPANION = "your companion";

export interface PersonalNames {
  /** `profile.childDisplayName` — fills `{name}`. */
  childName?: string;
  /**
   * `profile.companionName` — fills `{companion}`.
   *
   * Onboarding lets the child *name their own companion* ("Name your companion"), but the
   * authored copy hard-coded "Flicker" in 75 places — every speaker label plus four lines
   * where another character refers to the companion by name. A child who named their dragon
   * Sparky was told "Flicker's name is on it", which breaks the one relationship the whole
   * game is built on. Tokenised so the copy always uses the child's own name for them.
   */
  companionName?: string;
}

/**
 * Fill `{name}` / `{companion}` in child-facing copy. Safe on text with no tokens, and on
 * missing names (falls back rather than rendering "undefined" at a five-year-old).
 */
export function personalize(text: string, names: PersonalNames = {}): string {
  if (!text.includes("{")) return text;
  return text
    .replaceAll("{name}", names.childName?.trim() || FALLBACK_NAME)
    .replaceAll("{companion}", names.companionName?.trim() || FALLBACK_COMPANION);
}
