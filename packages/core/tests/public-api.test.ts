import { expect, test } from "bun:test";
import {
  CARTRIDGE_API,
  CARTRIDGE_API_NAMES,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  InputState,
  PixelSurface,
  applyCommand,
  parseCartridge,
} from "../src";

test("exposes the browser-independent engine boundary", () => {
  expect([CANVAS_WIDTH, CANVAS_HEIGHT]).toEqual([160, 144]);

  const input = new InputState();
  input.keyDown("KeyZ");
  expect(input.beginUpdate()).toEqual({ held: ["a"], pressed: ["a"] });

  const surface = new PixelSurface(2, 2, 0);
  applyCommand(surface, { op: "pixel", x: 1, y: 1, color: 3 });
  expect([...surface.data]).toEqual([0, 0, 0, 3]);

  expect(parseCartridge(JSON.stringify({
    format: "tynt",
    version: 1,
    title: "core",
    author: "core test",
    description: "Exercises the public engine boundary.",
    controls: "No controls",
    source: "x",
    canvas: { width: 160, height: 144 },
    palette: { model: "indexed", colors: ["#000000", "#555555", "#aaaaaa", "#ffffff"] },
  })).title).toBe("core");
});

test("exposes one complete cartridge creator API catalog", () => {
  expect(CARTRIDGE_API.map(({ name }) => name)).toEqual([
    "init", "update", "draw", "clear", "pixel", "line", "rect", "circle", "text",
    "sprite", "map", "camera", "button", "buttonPressed", "seed", "random", "overlap",
    "pointInRect", "frame", "every", "after", "tone", "sfx",
  ]);
  expect(CARTRIDGE_API_NAMES).toEqual(CARTRIDGE_API.map(({ name }) => name));
  expect(new Set(CARTRIDGE_API_NAMES).size).toBe(CARTRIDGE_API.length);
  expect(CARTRIDGE_API.every((entry) => entry.signature && entry.description && entry.snippet)).toBe(true);
});
