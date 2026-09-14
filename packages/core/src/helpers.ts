/** Creates a small deterministic pseudo-random number generator returning values from 0 inclusive to 1 exclusive. */
export function createRandom(seed = 1): () => number {
  let state = Math.trunc(seed) >>> 0;
  return () => {
    state = (Math.imul(1_664_525, state) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

/** Returns whether two axis-aligned rectangles overlap. Touching edges do not count as overlap. */
export function rectsOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return aw > 0 && ah > 0 && bw > 0 && bh > 0 && ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/** Returns whether a point lies inside a rectangle whose right and bottom edges are exclusive. */
export function pointInRect(px: number, py: number, x: number, y: number, width: number, height: number): boolean {
  return width > 0 && height > 0 && px >= x && px < x + width && py >= y && py < y + height;
}

/** Returns true on frames matching a positive interval and optional offset. */
export function frameEvery(frame: number, interval: number, offset = 0): boolean {
  const safeInterval = Math.max(1, Math.floor(interval));
  return frame >= offset && (frame - offset) % safeInterval === 0;
}

/** Returns true once a frame threshold has been reached. */
export function frameAfter(frame: number, threshold: number): boolean {
  return frame >= Math.max(0, Math.floor(threshold));
}
