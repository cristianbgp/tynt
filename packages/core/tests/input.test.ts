import { expect, test } from "bun:test";
import { InputState } from "../src";

test("pressed lasts for one update while held remains true", () => {
  const input = new InputState();
  input.keyDown("KeyZ");
  expect(input.beginUpdate()).toEqual({
    held: ["a"],
    pressed: ["a"],
    released: [],
  });
  expect(input.beginUpdate()).toEqual({
    held: ["a"],
    pressed: [],
    released: [],
  });
});

test("maps arrows, Z, and X and ignores repeat transitions", () => {
  const input = new InputState();
  for (const code of [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "KeyZ",
    "KeyX",
    "KeyZ",
  ])
    input.keyDown(code);
  expect(input.beginUpdate()).toEqual({
    held: ["left", "right", "up", "down", "a", "b"],
    pressed: ["left", "right", "up", "down", "a", "b"],
    released: [],
  });
  input.keyUp("KeyZ");
  expect(input.beginUpdate()).toEqual({
    held: ["left", "right", "up", "down", "b"],
    pressed: [],
    released: ["a"],
  });
  expect(input.beginUpdate().released).toEqual([]);
});

test("reset clears held and pending transitions", () => {
  const input = new InputState();
  input.keyDown("ArrowLeft");
  input.reset();
  expect(input.beginUpdate()).toEqual({ held: [], pressed: [], released: [] });
});

test("direct inputs share held and pressed transitions with keyboard input", () => {
  const input = new InputState();
  input.press("right");
  input.press("a");
  input.press("a");
  expect(input.beginUpdate()).toEqual({
    held: ["right", "a"],
    pressed: ["right", "a"],
    released: [],
  });
  input.release("right");
  expect(input.beginUpdate()).toEqual({
    held: ["a"],
    pressed: [],
    released: ["right"],
  });
});
