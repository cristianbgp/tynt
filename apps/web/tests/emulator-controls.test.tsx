// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { EmulatorControls } from "@/components/emulator-controls";

function mockDpadBounds() {
  const dpad = screen.getByLabelText("Direction pad");
  vi.spyOn(dpad, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    right: 144,
    bottom: 144,
    left: 0,
    width: 144,
    height: 144,
    toJSON: () => ({}),
  });
  return dpad;
}

describe("emulator controls", () => {
  test("slides from one direction into a diagonal without lifting", () => {
    const onInput = vi.fn();
    render(<EmulatorControls onInput={onInput} />);
    const dpad = mockDpadBounds();
    const left = screen.getByRole("button", { name: "Direction left" });
    const up = screen.getByRole("button", { name: "Direction up" });
    const right = screen.getByRole("button", { name: "Direction right" });

    expect(left).toHaveAttribute("data-cuelume-press", "");
    expect(left).toHaveAttribute("data-cuelume-release", "");
    expect(left).toHaveAttribute("data-cuelume-hover", "tick");
    expect(left.querySelector('[data-icon="arrow-left"]')).toBeInTheDocument();

    fireEvent.pointerDown(left, { pointerId: 7, clientX: 24, clientY: 72 });
    expect(left).toHaveAttribute("aria-pressed", "true");
    fireEvent.pointerMove(dpad, { pointerId: 7, clientX: 120, clientY: 24 });
    expect(left).toHaveAttribute("aria-pressed", "false");
    expect(up).toHaveAttribute("aria-pressed", "true");
    expect(right).toHaveAttribute("aria-pressed", "true");
    fireEvent.pointerUp(dpad, { pointerId: 7, clientX: 120, clientY: 24 });
    fireEvent.lostPointerCapture(dpad, { pointerId: 7 });

    expect(onInput.mock.calls).toEqual([
      ["left", true],
      ["left", false],
      ["up", true],
      ["right", true],
      ["up", false],
      ["right", false],
    ]);
  });

  test("releases a cancelled diagonal once and labels every control", () => {
    const onInput = vi.fn();
    render(<EmulatorControls onInput={onInput} />);
    const dpad = mockDpadBounds();

    fireEvent.pointerDown(dpad, { pointerId: 9, clientX: 24, clientY: 24 });
    fireEvent.pointerCancel(dpad, { pointerId: 9 });
    fireEvent.lostPointerCapture(dpad, { pointerId: 9 });

    expect(onInput.mock.calls).toEqual([
      ["up", true],
      ["left", true],
      ["up", false],
      ["left", false],
    ]);
    for (const name of ["Direction up", "Direction down", "Direction left", "Direction right", "Action A", "Action B"]) {
      expect(screen.getByRole("button", { name })).toBeVisible();
    }
  });

  test("releases a cancelled action once", () => {
    const onInput = vi.fn();
    render(<EmulatorControls onInput={onInput} />);
    const actionA = screen.getByRole("button", { name: "Action A" });

    fireEvent.pointerDown(actionA, { pointerId: 9 });
    fireEvent.pointerCancel(actionA, { pointerId: 9 });
    fireEvent.lostPointerCapture(actionA, { pointerId: 9 });

    expect(onInput.mock.calls).toEqual([["a", true], ["a", false]]);
  });

  test("keeps an action held while the direction thumb slides", () => {
    const onInput = vi.fn();
    render(<EmulatorControls onInput={onInput} />);
    const dpad = mockDpadBounds();
    const actionA = screen.getByRole("button", { name: "Action A" });

    fireEvent.pointerDown(dpad, { pointerId: 4, clientX: 24, clientY: 72 });
    fireEvent.pointerDown(actionA, { pointerId: 5 });
    fireEvent.pointerMove(dpad, { pointerId: 4, clientX: 120, clientY: 72 });
    fireEvent.pointerUp(dpad, { pointerId: 4, clientX: 120, clientY: 72 });
    expect(actionA).toHaveAttribute("aria-pressed", "true");
    fireEvent.pointerUp(actionA, { pointerId: 5 });

    expect(onInput.mock.calls).toEqual([
      ["left", true],
      ["a", true],
      ["left", false],
      ["right", true],
      ["right", false],
      ["a", false],
    ]);
  });

  test("ignores a second direction thumb until the first releases", () => {
    const onInput = vi.fn();
    render(<EmulatorControls onInput={onInput} />);
    const dpad = mockDpadBounds();
    const right = screen.getByRole("button", { name: "Direction right" });

    fireEvent.pointerDown(dpad, { pointerId: 2, clientX: 24, clientY: 72 });
    fireEvent.pointerDown(right, { pointerId: 3, clientX: 120, clientY: 72 });
    fireEvent.pointerUp(right, { pointerId: 3, clientX: 120, clientY: 72 });

    expect(onInput.mock.calls).toEqual([["left", true]]);
    expect(right).toHaveAttribute("aria-pressed", "false");
  });
});
