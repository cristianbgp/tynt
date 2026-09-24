import { expect, test } from "vitest";
import { readGamepadInput } from "@/runtime/gamepad-input";

function gamepad(pressed: number[] = [], axes: number[] = [0, 0], mapping = "standard") {
  return {
    connected: true,
    mapping,
    buttons: Array.from({ length: 17 }, (_, index) => ({ pressed: pressed.includes(index) })),
    axes,
  };
}

test("maps a standard controller's d-pad and face buttons to tynt inputs", () => {
  expect(readGamepadInput([gamepad([0, 1, 12, 14])])).toEqual(new Set(["up", "left", "a", "b"]));
});

test("ignores stick drift and accepts deliberate movement", () => {
  expect(readGamepadInput([gamepad([], [0.2, -0.3])])).toEqual(new Set());
  expect(readGamepadInput([gamepad([], [-0.7, 0.8])])).toEqual(new Set(["left", "down"]));
});

test("only reads a connected controller with a standard layout", () => {
  expect(readGamepadInput([gamepad([0], [0, 0], "")])).toBeNull();
  expect(readGamepadInput([{ ...gamepad([0]), connected: false }])).toBeNull();
  expect(readGamepadInput([null, gamepad([1])])).toEqual(new Set(["b"]));
});
