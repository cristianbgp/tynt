import { expect, test } from "bun:test";
import { FixedClock } from "../src";

test("does not step early and produces sixty steps per second", () => {
  const clock = new FixedClock();
  clock.reset(0);
  expect(clock.advance(16)).toBe(0);
  let steps = clock.advance(16.7);
  for (let time = 33.4; time < 1000; time += 16.7) steps += clock.advance(time);
  steps += clock.advance(1000);
  expect(steps).toBe(60);
});

test("caps catch-up work and drops excess backlog", () => {
  const clock = new FixedClock(5);
  clock.reset(0);
  expect(clock.advance(10_000)).toBe(5);
  expect(clock.advance(10_001)).toBe(0);
});

test("reset establishes a new origin", () => {
  const clock = new FixedClock();
  clock.reset(500);
  expect(clock.advance(510)).toBe(0);
  expect(clock.advance(517)).toBe(1);
});
