/**
 * Reward "juice" — the Glow Gauge (spec §17B.2).
 *
 * A strong choice must read as one connected beat: the companion reacts physically, a
 * burst of particles **travels into the matching meter**, the meter fills, and the world
 * itself responds. The particle-to-meter flight is the point — it visually links *the kind
 * choice* to *the reward*, so the child reads cause and effect rather than noticing a bar
 * moved somewhere.
 *
 * Two implementation rules the spec calls out explicitly, both honoured here:
 *
 * 1. **Evaluate the Bézier per frame in rAF — never a CSS transition.** CSS `cubic-bezier()`
 *    is an *easing* function; it shapes timing, not position. It cannot move an element
 *    along a spatial curve.
 * 2. **The arc lift is a fraction of stage height, not a pixel constant.** A hardcoded
 *    `-100px` would be an enormous arc on a small window and invisible on the projector.
 *
 * Budget: §17A.4's stimulation table caps a strong-choice consequence at 8–12 particles.
 * That is enforced by `PARTICLE_COUNT`, not left to a caller.
 *
 * Accessibility: everything here is skipped under `prefers-reduced-motion`, and none of it
 * is load-bearing — the meter still fills, the state still changes. This is decoration in
 * the strict sense: remove it and the game is identical minus delight (§20).
 */

/** §17A.4 stimulation budget: 8–12 simultaneous particles on a strong-choice consequence. */
const PARTICLE_COUNT = 10;
const FLIGHT_MS = 720;
/** Arc height as a fraction of stage height, so the curve looks the same at every size. */
const LIFT_FRACTION = 0.22;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Quadratic Bézier: B(t) = (1−t)²·P₀ + 2(1−t)t·P₁ + t²·P₂ */
function bezier(p0: number, p1: number, p2: number, t: number): number {
  const inv = 1 - t;
  return inv * inv * p0 + 2 * inv * t * p1 + t * t * p2;
}

const SKILL_TINT: Record<string, string> = {
  empathy: "#ff8fab",
  calm: "#6fd8c7",
  courage: "#ffd60a",
  worry_brave: "#ffc46b",
  self_worth: "#c79bf0",
  adapting_to_change: "#8fd3ff",
  friendship_repair: "#ffa9a9",
  ask_for_help: "#a9e5a0",
};

/**
 * Fly a burst of particles from the companion into the meter for `skill`, then pulse the
 * meter. No-ops safely if either endpoint isn't on screen.
 */
export function playMeterJuice(viewport: HTMLElement, skill: string): void {
  if (prefersReducedMotion()) return;

  const companion =
    viewport.querySelector<HTMLElement>('[data-char-id="companion"]') ??
    viewport.querySelector<HTMLElement>('[data-char-id="avatar"]');
  const meter = viewport.querySelector<HTMLElement>(`[data-meter-skill="${skill}"]`);
  if (!companion || !meter) return;

  const stage = viewport.getBoundingClientRect();
  const from = companion.getBoundingClientRect();
  const to = meter.getBoundingClientRect();

  // Coordinates relative to the scaled stage container (§17B.7), so the flight lands on
  // the meter at any resolution.
  const p0 = { x: from.left + from.width / 2 - stage.left, y: from.top + from.height * 0.3 - stage.top };
  const p2 = { x: to.left + to.width / 2 - stage.left, y: to.top + to.height / 2 - stage.top };
  const lift = stage.height * LIFT_FRACTION;
  const p1 = { x: (p0.x + p2.x) / 2, y: Math.min(p0.y, p2.y) - lift };

  const tint = SKILL_TINT[skill] ?? "#ffd60a";

  companion.classList.add("is-celebrating");
  window.setTimeout(() => companion.classList.remove("is-celebrating"), 700);

  const layer = document.createElement("div");
  layer.className = "juice-layer";
  layer.setAttribute("aria-hidden", "true");
  viewport.appendChild(layer);

  const particles: HTMLElement[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const dot = document.createElement("span");
    dot.className = "juice-particle";
    dot.style.background = tint;
    dot.style.boxShadow = `0 0 10px ${tint}`;
    layer.appendChild(dot);
    particles.push(dot);
  }

  // Small per-particle scatter so the burst reads as a spray, not a single moving dot.
  const jitter = particles.map(() => ({
    dx: (Math.random() - 0.5) * 46,
    dy: (Math.random() - 0.5) * 46,
    delay: Math.random() * 170,
  }));

  const started = performance.now();

  const frame = (now: number) => {
    let alive = false;
    for (let i = 0; i < particles.length; i++) {
      const { dx, dy, delay } = jitter[i];
      const t = (now - started - delay) / FLIGHT_MS;
      if (t < 0) {
        alive = true;
        continue;
      }
      if (t >= 1) {
        particles[i].style.opacity = "0";
        continue;
      }
      alive = true;
      // Scatter fades out as the particle converges, so they gather into the meter.
      const spread = 1 - t;
      const x = bezier(p0.x, p1.x, p2.x, t) + dx * spread;
      const y = bezier(p0.y, p1.y, p2.y, t) + dy * spread;
      particles[i].style.transform = `translate(${x}px, ${y}px) scale(${1 - t * 0.45})`;
      particles[i].style.opacity = String(t > 0.85 ? (1 - t) / 0.15 : 1);
    }

    if (alive) {
      requestAnimationFrame(frame);
    } else {
      layer.remove();
      meter.classList.add("meter-caught");
      window.setTimeout(() => meter.classList.remove("meter-caught"), 520);
    }
  };

  requestAnimationFrame(frame);
}

/**
 * The world responds to a kind choice (spec §17B.2).
 *
 * > "A 6-year-old reads *the grass blooms where I walk* far faster and more meaningfully
 * > than *the purple bar moved*. The abstract meter is for older bands and for parents;
 * > the youngest band needs the reward to be a tangible transformation in the game world."
 *
 * Flowers sprout around the avatar and the stage briefly warms. Earned-moment only — this
 * must never become an ambient particle wonderland, or it reintroduces exactly the
 * over-stimulation the product exists to avoid (§17A.4 calm-first budget).
 */
export function playWorldBloom(viewport: HTMLElement): void {
  if (prefersReducedMotion()) return;

  const avatar = viewport.querySelector<HTMLElement>('[data-char-id="avatar"]');
  if (!avatar) return;

  const stage = viewport.getBoundingClientRect();
  const box = avatar.getBoundingClientRect();
  const originX = box.left + box.width / 2 - stage.left;
  const originY = box.bottom - stage.top;

  const layer = document.createElement("div");
  layer.className = "juice-layer";
  layer.setAttribute("aria-hidden", "true");
  viewport.appendChild(layer);

  const BLOOMS = ["🌸", "🌼", "🌷", "🌻"];
  for (let i = 0; i < 7; i++) {
    const flower = document.createElement("span");
    flower.className = "world-bloom";
    flower.textContent = BLOOMS[i % BLOOMS.length];
    const spreadX = (Math.random() - 0.5) * stage.width * 0.22;
    const spreadY = (Math.random() - 0.5) * 60;
    flower.style.left = `${originX + spreadX}px`;
    flower.style.top = `${originY + spreadY}px`;
    flower.style.animationDelay = `${i * 70}ms`;
    layer.appendChild(flower);
  }

  viewport.classList.add("world-warmed");
  window.setTimeout(() => {
    viewport.classList.remove("world-warmed");
    layer.remove();
  }, 1900);
}
