// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useGamepadInput } from "@/hooks/use-gamepad-input";

afterEach(() => vi.unstubAllGlobals());

test("sends controller presses and releases, then clears input on disconnect", () => {
  let pad: ReturnType<typeof standardPad> | null = null;
  let nextFrame: FrameRequestCallback | undefined;
  vi.stubGlobal("navigator", { getGamepads: () => [pad] });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    nextFrame = callback;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const onInput = vi.fn();
  const { result, unmount } = renderHook(() => useGamepadInput(onInput));

  pad = standardPad([0, 15]);
  act(() => nextFrame?.(16));
  expect(result.current).toBe(true);
  expect(onInput).toHaveBeenCalledWith("a", true);
  expect(onInput).toHaveBeenCalledWith("right", true);

  onInput.mockClear();
  pad = null;
  act(() => nextFrame?.(32));
  expect(result.current).toBe(false);
  expect(onInput).toHaveBeenCalledWith("a", false);
  expect(onInput).toHaveBeenCalledWith("right", false);
  unmount();
});

test("clears held gamepad input when the page becomes hidden", () => {
  let nextFrame: FrameRequestCallback | undefined;
  vi.stubGlobal("navigator", { getGamepads: () => [standardPad([0])] });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    nextFrame = callback;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  const onInput = vi.fn();
  const { result, unmount } = renderHook(() => useGamepadInput(onInput));

  act(() => nextFrame?.(16));
  expect(result.current).toBe(true);
  onInput.mockClear();
  visibility.mockReturnValue("hidden");
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(result.current).toBe(false);
  expect(onInput).toHaveBeenCalledWith("a", false);

  unmount();
  visibility.mockRestore();
});

function standardPad(pressed: number[]) {
  return {
    connected: true,
    mapping: "standard",
    axes: [0, 0],
    buttons: Array.from({ length: 17 }, (_, index) => ({ pressed: pressed.includes(index) })),
  };
}
