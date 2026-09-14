// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Preview } from "@/components/preview";

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
});
