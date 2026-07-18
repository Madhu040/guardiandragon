/** Axis-separated AABB helpers for world movement (1920×1080 scene space). */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Aabb {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const WORLD_W = 1920;
export const WORLD_H = 1080;

export function pointInAabb(px: number, py: number, box: Aabb): boolean {
  return px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h;
}

export function aabbOverlap(a: Aabb, b: Aabb): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function aabbCenter(box: Aabb): Vec2 {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/** Feet-centered collision box for a standing character. */
export function characterFeetBox(cx: number, cy: number, w = 56, h = 36): Aabb {
  return { x: cx - w / 2, y: cy - h, w, h };
}

export function expandAabb(box: Aabb, pad: number): Aabb {
  return {
    x: box.x - pad,
    y: box.y - pad,
    w: box.w + pad * 2,
    h: box.h + pad * 2,
  };
}

/**
 * Move with axis separation so the avatar slides along walls.
 * `solids` are blocked; result is clamped to room bounds.
 */
export function moveWithCollision(
  pos: Vec2,
  delta: Vec2,
  footprint: { w: number; h: number },
  solids: Aabb[],
  bounds: Aabb,
): Vec2 {
  let x = pos.x;
  let y = pos.y;

  if (delta.x !== 0) {
    const next = characterFeetBox(x + delta.x, y, footprint.w, footprint.h);
    if (!solids.some((s) => aabbOverlap(next, s)) && contained(next, bounds)) {
      x += delta.x;
    }
  }
  if (delta.y !== 0) {
    const next = characterFeetBox(x, y + delta.y, footprint.w, footprint.h);
    if (!solids.some((s) => aabbOverlap(next, s)) && contained(next, bounds)) {
      y += delta.y;
    }
  }

  return { x, y };
}

function contained(box: Aabb, bounds: Aabb): boolean {
  return (
    box.x >= bounds.x &&
    box.y >= bounds.y &&
    box.x + box.w <= bounds.x + bounds.w &&
    box.y + box.h <= bounds.y + bounds.h
  );
}

/** Soft playable band: keep feet on the lower 55% of the scene (ground). */
export function defaultWalkBounds(): Aabb {
  const top = Math.floor(WORLD_H * 0.42);
  return { x: 80, y: top, w: WORLD_W - 160, h: WORLD_H - top - 40 };
}
