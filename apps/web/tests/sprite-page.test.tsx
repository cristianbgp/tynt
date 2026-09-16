// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import { SpritePage } from "@/pages/sprite-page";

test("paints multiple pixels with one touch stroke", () => {
  render(
    <MemoryRouter>
      <SpritePage soundEnabled onSoundToggle={() => {}} />
    </MemoryRouter>,
  );

  const first = screen.getByRole("button", { name: "Pixel 1, 1 color 0" });
  const second = screen.getByRole("button", { name: "Pixel 2, 1 color 0" });
  fireEvent.pointerDown(first, { pointerId: 7, pointerType: "touch", buttons: 1 });
  fireEvent.pointerMove(second, { pointerId: 7, pointerType: "touch", buttons: 1 });
  fireEvent.pointerUp(second, { pointerId: 7, pointerType: "touch", buttons: 0 });

  expect(screen.getByLabelText<HTMLTextAreaElement>("Sprite code").value).toContain("3, 3, 0, 0");
});

test("paints, clears, and copies an eight by eight indexed sprite", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  render(
    <MemoryRouter>
      <SpritePage soundEnabled onSoundToggle={() => {}} />
    </MemoryRouter>,
  );

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

test("imports generated sprite code without executing it", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SpritePage soundEnabled onSoundToggle={() => {}} />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "Import sprite code" }));
  const dialog = screen.getByRole("dialog", { name: "Import sprite code" });
  const pixels = [1, 2, ...Array<number>(62).fill(0)];
  fireEvent.change(screen.getByLabelText("Sprite code to import"), {
    target: { value: `const spritePixels = [${pixels.join(", ")}] as const;` },
  });
  await user.click(screen.getByRole("button", { name: "Import sprite" }));

  expect(dialog).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Pixel 1, 1 color 1" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Pixel 2, 1 color 2" })).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("sprite imported");
});

test("keeps the current sprite when imported code is invalid", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SpritePage soundEnabled onSoundToggle={() => {}} />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "Import sprite code" }));
  fireEvent.change(screen.getByLabelText("Sprite code to import"), {
    target: { value: "const spritePixels = [1, 2] as const;" },
  });
  await user.click(screen.getByRole("button", { name: "Import sprite" }));

  expect(screen.getByRole("alert")).toHaveTextContent("exactly 64 pixels");
  expect(screen.getByRole("dialog", { name: "Import sprite code" })).toBeVisible();
  expect(screen.getByLabelText<HTMLTextAreaElement>("Sprite code").value).toContain("0, 0, 0, 0");
});
