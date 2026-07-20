/**
 * Ambient life (spec §7.7 companion / §17A.4 calm-first budget).
 *
 * The world should feel *alive but calm* — the air drifts, light shifts, water glints — so a
 * still diorama reads as a place rather than a screenshot. The hard constraint is the
 * calm-first stimulation budget: this is the product's whole thesis (moving kids away from
 * twitchy dopamine), so ambient life must be **barely-there** — a handful of elements, very
 * slow, low-opacity, low-amplitude. It is never a particle wonderland; the reward juice
 * (§17B.2) is what spikes, precisely because the ambient bed stays quiet.
 *
 * Art note: the backgrounds are painted *overhead/isometric* scenes with no open sky band,
 * so the spec's illustrative "clouds drifting across the sky" has nowhere to sit — a white
 * cloud blob would land over grass. The faithful reading of "ambient life" for this art is
 * **drifting light motes** (pollen/dust in the air) and **slow dappled light** (sun moving
 * through leaves), which read on any outdoor scene, plus **grass sway** at foreground edges
 * and **water glints** where a scene actually has water.
 *
 * Rendered into the `world-layer` behind the characters so the camera carries it with the
 * ground. Decorative in the strict sense (§20): `aria-hidden`, `pointer-events: none`, no
 * text. All motion is CSS animation, so the global `prefers-reduced-motion` rule freezes it
 * for free (see styles/global.css) — nothing here is load-bearing.
 */

interface AmbientSpec {
  /** Drifting pollen/dust specks — the universal "the air is alive" element. */
  motes: number;
  /** Slow, soft warm light patches — sun shifting through leaves. */
  dapple: number;
  /** Foreground grass tufts that sway. */
  grass: number;
  /** Slow water glints — only for zones that actually have water on screen. */
  shimmer: number;
}

/**
 * Per-zone element budgets. Kept deliberately tiny (calm-first). Unknown zones fall back to
 * the generic outdoor set so a new background still breathes without bespoke tuning.
 */
const AMBIENT_BY_ZONE: Record<string, AmbientSpec> = {
  meadow: { motes: 5, dapple: 2, grass: 3, shimmer: 0 },
  forest: { motes: 4, dapple: 3, grass: 2, shimmer: 0 },
  bridge: { motes: 3, dapple: 1, grass: 1, shimmer: 4 },
  mountain: { motes: 4, dapple: 2, grass: 0, shimmer: 0 },
  cave: { motes: 4, dapple: 0, grass: 0, shimmer: 0 },
};

const DEFAULT_AMBIENT: AmbientSpec = { motes: 4, dapple: 1, grass: 2, shimmer: 0 };

function make(cls: string): HTMLSpanElement {
  const el = document.createElement("span");
  el.className = cls;
  return el;
}

/**
 * Render the ambient-life layer for `zoneId` into `world`. Replaces any prior layer so a
 * scene change re-seeds cleanly.
 */
export function renderAmbientLife(world: HTMLElement, zoneId: string): void {
  world.querySelector(".ambient-life")?.remove();

  const spec = AMBIENT_BY_ZONE[zoneId] ?? DEFAULT_AMBIENT;
  const layer = document.createElement("div");
  layer.className = "ambient-life";
  layer.setAttribute("aria-hidden", "true");

  // Light motes — barely-visible specks drifting through the air across the whole frame.
  for (let i = 0; i < spec.motes; i++) {
    const mote = make("ambient-mote");
    mote.style.left = `${10 + (i * 80) / Math.max(spec.motes, 1)}%`;
    mote.style.top = `${28 + (i % 4) * 15}%`;
    mote.style.animationDuration = `${13 + i * 3.5}s`;
    mote.style.animationDelay = `${-i * 2.6}s`;
    layer.appendChild(mote);
  }

  // Dappled light — large, very faint warm glows that drift slowly, like sun through leaves.
  for (let i = 0; i < spec.dapple; i++) {
    const light = make("ambient-dapple");
    light.style.left = `${18 + i * 34}%`;
    light.style.top = `${20 + i * 22}%`;
    light.style.animationDuration = `${26 + i * 9}s`;
    light.style.animationDelay = `${-i * 11}s`;
    layer.appendChild(light);
  }

  // Grass tufts sway gently along the foreground band.
  for (let i = 0; i < spec.grass; i++) {
    const blade = make("ambient-grass");
    blade.style.left = `${12 + (i * 76) / Math.max(spec.grass, 1)}%`;
    blade.style.top = `${88 + (i % 2) * 4}%`;
    blade.style.animationDuration = `${6.5 + (i % 3)}s`;
    blade.style.animationDelay = `${-i * 0.7}s`;
    layer.appendChild(blade);
  }

  // Water glints — slow twinkle across the lower-mid band where a bridge/pond sits.
  for (let i = 0; i < spec.shimmer; i++) {
    const glint = make("ambient-shimmer");
    glint.style.left = `${18 + i * 17}%`;
    glint.style.top = `${64 + (i % 2) * 6}%`;
    glint.style.animationDuration = `${4 + (i % 3)}s`;
    glint.style.animationDelay = `${-i * 1.3}s`;
    layer.appendChild(glint);
  }

  // Nothing to show (e.g. a zone budgeted to all-zeros) → don't leave an empty node.
  // Appended (not prepended) so it lands on top of the background art but, because
  // GameView calls this before the character loop, still behind every character.
  if (layer.childElementCount > 0) world.appendChild(layer);
}
