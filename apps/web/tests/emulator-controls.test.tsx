// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { EmulatorControls } from "@/components/emulator-controls";

function useMobileViewport(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

function renderExpanded(onInput = vi.fn()) {
  useMobileViewport(true);
  render(<EmulatorControls onInput={onInput} />);
  return onInput;
}

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
  afterEach(() => vi.unstubAllGlobals());

  test("defaults to collapsed on desktop and toggles accessible screen controls", () => {
    useMobileViewport(false);
    render(<EmulatorControls onInput={vi.fn()} />);

    const toggle = screen.getByRole("button", { name: "Show controls" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("data-cuelume-press", "");
    expect(screen.queryByLabelText("Direction pad")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Hide controls" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByLabelText("Direction pad")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Hide controls" }));
    expect(screen.queryByLabelText("Direction pad")).not.toBeInTheDocument();
  });

  test("defaults to expanded on mobile", () => {
    useMobileViewport(true);
    render(<EmulatorControls onInput={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Hide controls" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByLabelText("Direction pad")).toBeVisible();
  });

  test("releases held inputs before collapsing", () => {
    const onInput = renderExpanded();
    fireEvent.pointerDown(screen.getByRole("button", { name: "Action A" }), { pointerId: 9 });
    fireEvent.click(screen.getByRole("button", { name: "Hide controls" }));

    expect(onInput.mock.calls).toEqual([
      ["a", true],
      ["a", false],
    ]);
  });

  test("slides from one direction into a diagonal without lifting", () => {
    const onInput = renderExpanded();
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
    const onInput = renderExpanded();
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
    for (const name of [
      "Direction up",
      "Direction down",
      "Direction left",
      "Direction right",
      "Action A",
      "Action B",
    ]) {
      expect(screen.getByRole("button", { name })).toBeVisible();
    }
  });

  test("releases a cancelled action once", () => {
    const onInput = renderExpanded();
    const actionA = screen.getByRole("button", { name: "Action A" });

    fireEvent.pointerDown(actionA, { pointerId: 9 });
    fireEvent.pointerCancel(actionA, { pointerId: 9 });
    fireEvent.lostPointerCapture(actionA, { pointerId: 9 });

    expect(onInput.mock.calls).toEqual([
      ["a", true],
      ["a", false],
    ]);
  });

  test("keeps an action held while the direction thumb slides", () => {
    const onInput = renderExpanded();
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
    const onInput = renderExpanded();
    const dpad = mockDpadBounds();
    const right = screen.getByRole("button", { name: "Direction right" });

    fireEvent.pointerDown(dpad, { pointerId: 2, clientX: 24, clientY: 72 });
    fireEvent.pointerDown(right, { pointerId: 3, clientX: 120, clientY: 72 });
    fireEvent.pointerUp(right, { pointerId: 3, clientX: 120, clientY: 72 });

    expect(onInput.mock.calls).toEqual([["left", true]]);
    expect(right).toHaveAttribute("aria-pressed", "false");
  });
});
