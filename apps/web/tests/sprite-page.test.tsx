// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import { SpritePage } from "@/pages/sprite-page";

test("paints, clears, and copies an eight by eight indexed sprite", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  render(<MemoryRouter><SpritePage soundEnabled onSoundToggle={() => {}} /></MemoryRouter>);

  expect(screen.getByRole("heading", { name: "Sprite editor" })).toBeVisible();
  expect(screen.getAllByRole("button", { name: /^Pixel/ })).toHaveLength(64);
  await user.click(screen.getByRole("button", { name: "Color 3" }));
  await user.click(screen.getByRole("button", { name: "Pixel 1, 1 color 0" }));
  expect(screen.getByLabelText<HTMLTextAreaElement>("Sprite code").value).toContain("3, 0, 0, 0");

  await user.click(screen.getByRole("button", { name: "Copy sprite code" }));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining("const spritePixels"));
  expect(screen.getByRole("status")).toHaveTextContent("copied");

  await user.click(screen.getByRole("button", { name: "Clear sprite" }));
  expect(screen.getByRole("button", { name: "Pixel 1, 1 color 0" })).toBeVisible();
});
