import { expect, test } from "vitest";
import { CanvasRenderer } from "../src/runtime/renderer";

test("replays indexed commands into exact RGBA bytes and persists the framebuffer", () => {
  let output = new Uint8ClampedArray();
  const context = {
    imageSmoothingEnabled: true,
    createImageData: (width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
    }),
    putImageData: (image: { data: Uint8ClampedArray }) => {
      output = image.data.slice();
    },
  };
  const renderer = new CanvasRenderer(context, 2, 2);
  renderer.replay([
    { op: "clear", color: 1 },
    { op: "pixel", x: 1, y: 0, color: 3 },
  ]);
  expect(context.imageSmoothingEnabled).toBe(false);
  expect([...output]).toEqual([
    85, 85, 85, 255, 255, 255, 255, 255, 85, 85, 85, 255, 85, 85, 85, 255,
  ]);
  renderer.replay([{ op: "pixel", x: 0, y: 1, color: 2 }]);
  expect([...output].slice(8, 16)).toEqual([170, 170, 170, 255, 85, 85, 85, 255]);
});
