import { expect, test } from "vitest";
import { CARTRIDGE_API_NAMES } from "@tynt/core";
import { TYNT_API_COMPLETIONS } from "@/editor/tynt-api";

test("offers every drawing, input, deterministic, camera, sprite, and audio global", () => {
  expect(TYNT_API_COMPLETIONS.map(({ label }) => label)).toEqual([
    "init", "update", "draw", "clear", "pixel", "line", "rect", "circle", "text", "sprite", "map", "camera",
    "button", "buttonPressed", "seed", "random", "overlap", "pointInRect", "frame", "every", "after", "tone", "sfx",
  ]);
  expect(TYNT_API_COMPLETIONS.map(({ label }) => label)).toEqual(CARTRIDGE_API_NAMES);
});
