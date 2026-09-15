// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { RuntimeDebugger } from "@/components/runtime-debugger";
import { createRuntimeDebugStore } from "@/runtime/debug-store";

test("stays compact until opened and exposes accessible runtime controls", async () => {
  const user = userEvent.setup();
  const pause = vi.fn();
  const step = vi.fn();
  const store = createRuntimeDebugStore();
  store.update({ frame: 12, held: ["left"], pressed: ["a"] });
  render(<RuntimeDebugger active paused={false} store={store} onPause={pause} onResume={() => {}} onStep={step} onRestart={() => {}} onScreenshot={() => {}} />);

  const toggle = screen.getByRole("button", { name: "Open debugger" });
  expect(toggle).toHaveAttribute("data-cuelume-hover", "tick");
  expect(screen.queryByRole("region", { name: "Runtime debugger" })).not.toBeInTheDocument();
  await user.click(toggle);

  const panel = screen.getByRole("region", { name: "Runtime debugger" });
  expect(panel).toBeVisible();
  expect(within(panel).getByText("frame 12")).toBeVisible();
  expect(screen.getByText("left", { selector: '[data-held="true"]' })).toBeVisible();
  expect(screen.getByText("a", { selector: '[data-pressed="true"]' })).toBeVisible();
  expect(screen.getByRole("button", { name: "Step frame" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Pause" }));
  expect(pause).toHaveBeenCalledOnce();
});

test("enables single stepping only for an active paused cartridge", async () => {
  const user = userEvent.setup();
  const step = vi.fn();
  const store = createRuntimeDebugStore();
  store.update({ frame: 3, held: [], pressed: [] });
  render(<RuntimeDebugger active paused store={store} onPause={() => {}} onResume={() => {}} onStep={step} onRestart={() => {}} onScreenshot={() => {}} />);
  await user.click(screen.getByRole("button", { name: "Open debugger" }));

  expect(screen.getByRole("button", { name: "Resume" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Step frame" }));
  expect(step).toHaveBeenCalledOnce();
});
