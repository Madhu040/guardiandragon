/**
 * The diegetic stepping-stone path (spec §7.7).
 *
 * Children need intra-chapter orientation — "where am I in this story" — but a
 * conventional progress-bar HUD pulls against the stealth-learning pillar: it turns a
 * *felt story* into a *complete-the-bar task* and re-measures the child. The spec's
 * resolution is to make progress **part of the world, not chrome**: a trail of
 * stepping-stones the child actually travels, with the current stone lit.
 *
 * So this renders into the `world-layer` (not the fixed viewport), which means the camera
 * transforms it along with the ground — the stones read as embedded in the meadow/forest,
 * not bolted on top. It is decorative in the strict sense (§20): `aria-hidden`,
 * `pointer-events: none`, no text, no numbers, no countdown. Lighting a stone is a quiet
 * arrival cue, never a scored milestone (§7.7 acceptance + §17A.4 calm-first budget).
 *
 * Rendering notes learned from the first pass against the detailed painted backgrounds:
 *  - It is drawn as **one connected trail** (a soft worn-path line through the stones), so
 *    three stones read as *a path I'm walking* rather than scattered rocks. The line behind
 *    the travelled stones is solid; the road ahead is faintly dashed.
 *  - Each stone carries a ground-shadow so it separates from any busy background.
 *  - It sits just above the ground-level stage objects (via z-index) so a cairn or sign can
 *    never occlude the "you are here" stone — this is the foreground path, it reads in front.
 *
 * One stone per *main* scene of the chapter (`chapterPath`); branch/detour scenes fold onto
 * their parent stone (see `pathIndexForScene`) so a side-quest never reads as extra progress.
 */

import { chapterPath, pathIndexForScene } from "../content/index.js";

const SVG_NS = "http://www.w3.org/2000/svg";
/** Lower-band Y (of 1080) the trail sits on, lifted off the extreme edge so it clears the
 *  bottom vignette and isn't cut by the frame. */
const BASE_Y = 940;
/** Gentle up/down wander so the trail reads as a hand-laid footpath, not a ruler. */
const MEANDER = 22;
/** Horizontal inset (of 1920) so end stones don't kiss the frame edge. */
const MARGIN_X = 210;
const STONE_RX = 40;
const STONE_RY = 19;

function stonePoints(count: number): Array<{ x: number; y: number }> {
  const span = 1920 - MARGIN_X * 2;
  const step = count > 1 ? span / (count - 1) : 0;
  return Array.from({ length: count }, (_, i) => ({
    x: MARGIN_X + step * i,
    // Phase offset keeps a 2-stone path (ch3/ch4) from landing dead flat.
    y: BASE_Y + Math.sin(i * 1.1 + 0.6) * MEANDER,
  }));
}

function line(pts: Array<{ x: number; y: number }>, cls: string): SVGPolylineElement {
  const el = document.createElementNS(SVG_NS, "polyline");
  el.setAttribute("points", pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "));
  el.setAttribute("class", cls);
  return el;
}

function stone(p: { x: number; y: number }, state: string): SVGGElement {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", `path-stone ${state}`);

  const shadow = document.createElementNS(SVG_NS, "ellipse");
  shadow.setAttribute("class", "path-stone-shadow");
  shadow.setAttribute("cx", String(p.x));
  shadow.setAttribute("cy", String(p.y + 6));
  shadow.setAttribute("rx", String(STONE_RX));
  shadow.setAttribute("ry", String(STONE_RY));

  const cap = document.createElementNS(SVG_NS, "ellipse");
  cap.setAttribute("class", "path-stone-cap");
  cap.setAttribute("cx", String(p.x));
  cap.setAttribute("cy", String(p.y));
  cap.setAttribute("rx", String(STONE_RX));
  cap.setAttribute("ry", String(STONE_RY));

  g.append(shadow, cap);
  return g;
}

/**
 * Draw the chapter's stepping-stone trail into `world`. No-ops (removing any stale trail)
 * when the chapter has no mapped path or the current scene isn't on it, so an unmapped
 * scene simply shows no path rather than a wrong one.
 */
export function renderProgressPath(
  world: HTMLElement,
  chapterId: string,
  currentSceneId: string,
): void {
  world.querySelector(".progress-path")?.remove();

  const stones = chapterPath(chapterId);
  const current = pathIndexForScene(chapterId, currentSceneId);
  if (stones.length < 2 || current < 0) return;

  const pts = stonePoints(stones.length);

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "progress-path");
  svg.setAttribute("viewBox", "0 0 1920 1080");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  // The worn path: solid up to and including where the child stands, faintly dashed for the
  // road still ahead. Split so the two portions can be styled independently.
  const walkedPts = pts.slice(0, current + 1);
  const aheadPts = pts.slice(current);
  if (walkedPts.length > 1) svg.appendChild(line(walkedPts, "path-trail walked"));
  if (aheadPts.length > 1) svg.appendChild(line(aheadPts, "path-trail ahead"));

  for (let i = 0; i < pts.length; i++) {
    const state = i < current ? "walked" : i === current ? "here" : "ahead";
    svg.appendChild(stone(pts[i], state));
  }

  world.appendChild(svg);
}
