// @vitest-environment jsdom

import { render as testingRender, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { ReactElement } from "react";
import { Preview } from "@/components/preview";
import { TooltipProvider } from "@/components/ui/tooltip";

function render(element: ReactElement) {
  return testingRender(<TooltipProvider>{element}</TooltipProvider>);
}

const previewProps = {
  interactionRef: null,
  canvasRef: vi.fn(),
  onKeyDown: vi.fn(() => false),
  onKeyUp: vi.fn(() => false),
  onInput: vi.fn(),
  onBlur: vi.fn(),
};

describe("game preview errors", () => {
  test("covers an unavailable preview with a pointer to the error details", () => {
    render(<Preview {...previewProps} showError />);

    expect(screen.getByText("Run error", { exact: true })).toBeVisible();
    expect(screen.getByText("Check details below", { exact: true })).toBeVisible();
  });

  test("does not show an error layer while a valid preview remains", () => {
    render(<Preview {...previewProps} showError={false} />);

    expect(screen.queryByText("Run error", { exact: true })).not.toBeInTheDocument();
  });

  test("shows a labeled gamepad icon without hiding the keyboard hint", () => {
    render(<Preview {...previewProps} gamepadConnected />);

    expect(screen.getByRole("status", { name: "Gamepad connected" })).toBeVisible();
    expect(screen.getByRole("status", { name: "Gamepad connected" })).not.toHaveAttribute("title");
    expect(screen.getByRole("status", { name: "Gamepad connected" })).toHaveClass("bg-foreground");
    expect(
      screen
        .getByRole("status", { name: "Gamepad connected" })
        .compareDocumentPosition(screen.getByRole("button", { name: "Show controls" })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("ARROWS · Z / X")).toBeVisible();
  });

  test("keeps the gamepad icon visible while no controller is detected", () => {
    render(<Preview {...previewProps} />);

    expect(screen.getByRole("status", { name: "No standard gamepad detected" })).toBeVisible();
  });
});
