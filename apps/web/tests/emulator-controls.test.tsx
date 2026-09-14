// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { EmulatorControls } from "@/components/emulator-controls";

describe("emulator controls", () => {
  test("shares held and released pointer transitions with the runtime", () => {
    const onInput = vi.fn();
    render(<EmulatorControls onInput={onInput} />);
    const left = screen.getByRole("button", { name: "Direction left" });

    expect(left).toHaveAttribute("data-cuelume-press", "");
    expect(left).toHaveAttribute("data-cuelume-release", "");
    expect(left).toHaveAttribute("data-cuelume-hover", "tick");
    expect(left.querySelector('[data-icon="arrow-left"]')).toBeInTheDocument();

    fireEvent.pointerDown(left, { pointerId: 7 });
    expect(left).toHaveAttribute("aria-pressed", "true");
    fireEvent.pointerUp(left, { pointerId: 7 });
    fireEvent.lostPointerCapture(left, { pointerId: 7 });

    expect(onInput.mock.calls).toEqual([["left", true], ["left", false]]);
    expect(left).toHaveAttribute("aria-pressed", "false");
  });

  test("releases cancelled input once and labels every control", () => {
    const onInput = vi.fn();
    render(<EmulatorControls onInput={onInput} />);
    const actionA = screen.getByRole("button", { name: "Action A" });

    fireEvent.pointerDown(actionA, { pointerId: 9 });
    fireEvent.pointerCancel(actionA, { pointerId: 9 });
    fireEvent.lostPointerCapture(actionA, { pointerId: 9 });

    expect(onInput.mock.calls).toEqual([["a", true], ["a", false]]);
    for (const name of ["Direction up", "Direction down", "Direction left", "Direction right", "Action A", "Action B"]) {
      expect(screen.getByRole("button", { name })).toBeVisible();
    }
  });
});
