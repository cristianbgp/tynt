// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import { SoundPage } from "@/pages/sound-page";

vi.mock("cuelume", () => ({ play: vi.fn() }));

test("composes, previews, clears, and copies a sixteen-step sound effect", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  const audioEvents: Array<{ frequency: number; delay: number }> = [];
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

  render(
    <MemoryRouter>
      <SoundPage
        soundEnabled
        onSoundToggle={() => {}}
        playAudio={(command) => { audioEvents.push(command); }}
        stopAudio={() => {}}
      />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Sound editor" })).toBeVisible();
  expect(screen.getAllByRole("button", { name: /^Step \d+ / })).toHaveLength(16 * 37);
  expect(screen.getByLabelText<HTMLTextAreaElement>("Sound code").value).toContain("[523.25, 0, 659.25, 0, 783.99");
  await user.click(screen.getByRole("button", { name: "Clear sound" }));

  await user.click(screen.getByRole("button", { name: "Step 1 C4" }));
  await user.click(screen.getByRole("button", { name: "Step 3 E4" }));
  expect(screen.getByLabelText<HTMLTextAreaElement>("Sound code").value).toContain("[261.63, 0, 329.63");

  await user.click(screen.getByRole("button", { name: "Play sound" }));
  expect(audioEvents).toEqual([
    expect.objectContaining({ frequency: 261.63, delay: 0 }),
    expect.objectContaining({ frequency: 329.63, delay: 160 }),
  ]);

  await user.click(screen.getByRole("button", { name: "Copy sound code" }));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('sfx(sound, 80, 0.15, "square")'));
  expect(screen.getByText("copied", { selector: "p" })).toBeVisible();

  await user.click(screen.getByRole("button", { name: "Clear sound" }));
  expect(screen.getByLabelText<HTMLTextAreaElement>("Sound code").value).toContain("[0, 0, 0");
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
      <SoundPage soundEnabled={false} onSoundToggle={() => {}} playAudio={() => {}} stopAudio={stopAudio} />
    </MemoryRouter>,
  );

  expect(stopAudio).toHaveBeenCalledOnce();
});
