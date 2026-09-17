import { describe, expect, test } from "bun:test";
import {
  clamp,
  createRandom,
  frameAfter,
  frameEvery,
  pointInRect,
  rectsOverlap,
  wrap,
} from "../src";

describe("small deterministic cartridge helpers", () => {
  test("repeats the same pseudo-random sequence for the same seed", () => {
    const first = createRandom(1);
    const second = createRandom(1);
    expect([first(), first()]).toEqual([
      0.23645552527159452, 0.3692706737201661,
    ]);
    expect([second(), second()]).toEqual([
      0.23645552527159452, 0.3692706737201661,
    ]);
  });

  test("uses exclusive rectangle edges for collision checks", () => {
    expect(rectsOverlap(0, 0, 4, 4, 3, 3, 4, 4)).toBe(true);
    expect(rectsOverlap(0, 0, 4, 4, 4, 0, 4, 4)).toBe(false);
    expect(pointInRect(3, 3, 0, 0, 4, 4)).toBe(true);
    expect(pointInRect(4, 3, 0, 0, 4, 4)).toBe(false);
  });

  test("derives repeat and delay timers from deterministic frame numbers", () => {
    expect([0, 1, 2, 3, 4].map((frame) => frameEvery(frame, 2))).toEqual([
      true,
      false,
      true,
      false,
      true,
    ]);
    expect(frameEvery(5, 3, 2)).toBe(true);
    expect(frameAfter(9, 10)).toBe(false);
    expect(frameAfter(10, 10)).toBe(true);
  });

  test("clamps values and wraps them into a half-open range", () => {
    expect([clamp(-2, 0, 10), clamp(4, 0, 10), clamp(12, 0, 10)]).toEqual([
      0, 4, 10,
    ]);
    expect([wrap(-1, 0, 10), wrap(12, 0, 10), wrap(7, 5, 8)]).toEqual([
      9, 2, 7,
    ]);
    expect(() => clamp(1, 2, 1)).toThrow(/range/i);
    expect(() => wrap(1, 2, 2)).toThrow(/range/i);
  });
});
