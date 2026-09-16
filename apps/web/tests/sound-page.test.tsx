// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import { SoundPage } from "@/pages/sound-page";

vi.mock("cuelume", () => ({ play: vi.fn() }));

test("paints multiple notes with one touch stroke", () => {
  render(
    <MemoryRouter>
      <SoundPage soundEnabled onSoundToggle={() => {}} />
    </MemoryRouter>,
  );

  const first = screen.getByRole("button", { name: "Step 1 C4" });
  const second = screen.getByRole("button", { name: "Step 2 E4" });
  fireEvent.pointerDown(first, { pointerId: 7, pointerType: "touch", buttons: 1 });
  fireEvent.pointerMove(second, { pointerId: 7, pointerType: "touch", buttons: 1 });
  fireEvent.pointerUp(second, { pointerId: 7, pointerType: "touch", buttons: 0 });

  expect(screen.getByLabelText<HTMLTextAreaElement>("Sound code").value).toContain(
    "[261.63, 329.63, 659.25",
  );
});

test("composes, previews, clears, and copies a sixteen-step sound effect", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  const audioEvents: Array<{ frequency: number; delay: number }> = [];
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

  render(
    <MemoryRouter>
      <SoundPage
        soundEnabled
        onSoundToggle={() => {}}
        playAudio={(command) => {
          audioEvents.push(command);
        }}
        stopAudio={() => {}}
      />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Sound editor" })).toBeVisible();
  const stepButtons = screen.getAllByRole<HTMLButtonElement>("button", { name: /^Step \d+ / });
  const codeOutput = screen.getByLabelText<HTMLTextAreaElement>("Sound code");
  const stepButton = (label: string) =>
    stepButtons.find((button) => button.getAttribute("aria-label") === label)!;
  expect(stepButtons).toHaveLength(16 * 37);
  expect(codeOutput.value).toContain("[523.25, 0, 659.25, 0, 783.99");
  fireEvent.click(screen.getByLabelText("Clear sound"));

  fireEvent.pointerDown(stepButton("Step 1 C4"), {
    pointerId: 1,
    pointerType: "mouse",
    buttons: 1,
  });
  fireEvent.pointerUp(stepButton("Step 1 C4"), { pointerId: 1, pointerType: "mouse", buttons: 0 });
  fireEvent.pointerDown(stepButton("Step 3 E4"), {
    pointerId: 2,
    pointerType: "mouse",
    buttons: 1,
  });
  fireEvent.pointerUp(stepButton("Step 3 E4"), { pointerId: 2, pointerType: "mouse", buttons: 0 });
  expect(codeOutput.value).toContain("[261.63, 0, 329.63");

  fireEvent.click(screen.getByLabelText("Play sound"));
  expect(audioEvents).toEqual([
    expect.objectContaining({ frequency: 261.63, delay: 0 }),
    expect.objectContaining({ frequency: 329.63, delay: 160 }),
  ]);

  fireEvent.click(screen.getByLabelText("Copy sound code"));
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('sfx(sound, 80, 0.15, "square")'),
    ),
  );
  expect(screen.getByText("copied", { selector: "p" })).toBeVisible();

  fireEvent.click(screen.getByLabelText("Clear sound"));
  expect(codeOutput.value).toContain("[0, 0, 0");
});

test("stops an active preview when app sound is disabled", () => {
  const stopAudio = vi.fn();
  const { rerender } = render(
    <MemoryRouter>
      <SoundPage soundEnabled onSoundToggle={() => {}} playAudio={() => {}} stopAudio={stopAudio} />
    </MemoryRouter>,
  );
  stopAudio.mockClear();

  rerender(
    <MemoryRouter>
      <SoundPage
        soundEnabled={false}
        onSoundToggle={() => {}}
        playAudio={() => {}}
        stopAudio={stopAudio}
      />
    </MemoryRouter>,
  );

  expect(stopAudio).toHaveBeenCalledOnce();
});

test("imports generated sound code and its playback settings", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SoundPage soundEnabled onSoundToggle={() => {}} />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "Import sound code" }));
  const dialog = screen.getByRole("dialog", { name: "Import sound code" });
  fireEvent.change(screen.getByLabelText("Sound code to import"), {
    target: {
      value: `const sound = [261.63, 0, 329.63, 0, 392, 0, 523.25, 0, 392, 0, 329.63, 0, 261.63, 0, 0, 0] as const;

// play with:
sfx(sound, 120, 0.25, "sine");`,
    },
  });
  await user.click(screen.getByRole("button", { name: "Import sound" }));

  expect(dialog).not.toBeInTheDocument();
  expect(screen.getByLabelText<HTMLTextAreaElement>("Sound code").value).toContain(
    'sfx(sound, 120, 0.25, "sine")',
  );
  expect(screen.getByRole("button", { name: "sine" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText("sound imported", { selector: "p" })).toBeVisible();
});

test("rejects executable sound code without changing the current sound", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SoundPage soundEnabled onSoundToggle={() => {}} />
    </MemoryRouter>,
  );
  const original = screen.getByLabelText<HTMLTextAreaElement>("Sound code").value;

  await user.click(screen.getByRole("button", { name: "Import sound code" }));
  fireEvent.change(screen.getByLabelText("Sound code to import"), {
    target: { value: "globalThis.fetch('https://example.com')" },
  });
  await user.click(screen.getByRole("button", { name: "Import sound" }));

  expect(screen.getByRole("alert")).toHaveTextContent("generated sound code");
  expect(screen.getByRole("dialog", { name: "Import sound code" })).toBeVisible();
  expect(screen.getByLabelText<HTMLTextAreaElement>("Sound code").value).toBe(original);
});
