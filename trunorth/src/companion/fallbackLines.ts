import fallbacks from "../../content/fallbacks/companion-fallbacks.json";

/**
 * Client-side access to the hand-authored fallback library.
 *
 * Until now only the **server** imported `companion-fallbacks.json`, which left the client
 * with nothing authored to say when the proxy itself is unreachable — exactly the case
 * spec §17D calls out as able to happen on stage. `SceneEngine`'s catch paths used a
 * hardcoded generic string instead of the vetted per-decision copy.
 *
 * Keep this module free of DOM/server imports: it is bundled into the client.
 */
const LIBRARY = fallbacks as Record<string, Record<string, string>>;

export type FallbackBand = "strong" | "partial" | "poor" | "timeout" | "safety";

/**
 * The last-resort line when a decision point has no authored entry. Mirrors the server's
 * `getFallback` default so both paths degrade to the same words.
 */
export const GENERIC_FALLBACK_LINE = "You're doing your best — let's keep going together.";

export function fallbackLine(decisionPointId: string, band: FallbackBand): string {
  return LIBRARY[decisionPointId]?.[band] ?? GENERIC_FALLBACK_LINE;
}

/**
 * Spec §17D — "API failure outside demo mode (can happen on stage): never a raw error or
 * spinner-of-death. The companion says something in-character ... and the proxy auto-retries
 * once."
 *
 * This is the line the child sees *during* the single retry, before we fall through to the
 * authored per-decision fallback.
 *
 * ⚠️ **SME DRAFT — not signed off.** Child-facing copy; spec §8.6 gates it behind SME review
 * like the distress re-entry copy in `src/counselor/checkin.ts`.
 */
export const API_RETRY_LINE = "My words got a little tangled — let me try that again!";
