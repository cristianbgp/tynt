// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { createCartridgeLibrary, createMemoryAdapter } from "@/library/cartridge-library";

const runtime = vi.hoisted(() => ({
  canvasRef: () => {}, status: "ready", error: "", showPreviewError: false,
  isRunning: true, isCompiling: false, run: vi.fn(), stop: vi.fn(),
  setKey: vi.fn(() => false), setInput: vi.fn(), resetInput: vi.fn(),
  clearError: vi.fn(), reportError: vi.fn(), announce: vi.fn(),
}));
const sound = vi.hoisted(() => ({ play: vi.fn() }));

vi.mock("@/hooks/use-runtime", () => ({ useRuntime: () => runtime }));
vi.mock("cuelume", () => sound);

import { LocalPlayPage } from "@/pages/local-play-page";
import { PublicPlayPage } from "@/pages/public-play-page";

function makeLibrary() {
  return createCartridgeLibrary(createMemoryAdapter(), {
    createId: () => "play-one",
    now: () => "2026-09-14T00:00:00.000Z",
  });
}

function renderPage(library: ReturnType<typeof makeLibrary>, id = "play-one") {
  return render(
    <MemoryRouter initialEntries={[`/play/local/${id}`]}>
      <Routes>
        <Route path="play/local/:id" element={<LocalPlayPage library={library} soundEnabled onSoundToggle={() => {}} />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  runtime.run.mockResolvedValue(true);
});

test("loads, starts, and exposes focused play controls for a local cartridge", async () => {
  const library = makeLibrary();
  const source = "export function init(){} export function update(){} export function draw(){}";
  await library.save({ draft: { title: "orbit", source, author: "cris", controls: "A fires" } });
  renderPage(library);

  expect(await screen.findByRole("heading", { name: "orbit" })).toBeVisible();
  await waitFor(() => expect(runtime.run).toHaveBeenCalledWith(source));
  expect(document.querySelector("#preview")).toHaveFocus();
  expect(screen.getByRole("link", { name: "Edit cartridge" })).toHaveAttribute("href", "/?local=play-one");
  expect(screen.getByRole("link", { name: "Open gallery" })).toHaveAttribute("href", "/gallery");
  expect(screen.getByRole("link", { name: "Open library" })).toHaveAttribute("href", "/library");
  expect(screen.getByRole("link", { name: "Open sprites" })).toHaveAttribute("href", "/sprites");
  expect(screen.getByRole("group", { name: "Play controls" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Pause" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Restart" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Enter fullscreen" })).toBeVisible();
});

test("loads a repository cartridge at its public route", async () => {
  render(
    <MemoryRouter initialEntries={["/play/public/snake"]}>
      <Routes>
        <Route path="play/public/:slug" element={<PublicPlayPage soundEnabled onSoundToggle={() => {}} />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByRole("heading", { name: "snake" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Edit cartridge" })).toHaveAttribute("href", "/?cartridge=snake");
  expect(screen.getByRole("link", { name: "Open gallery" })).toHaveAttribute("href", "/gallery");
  expect(screen.getByRole("link", { name: "Open library" })).toHaveAttribute("href", "/library");
  expect(screen.getByRole("link", { name: "Open sprites" })).toHaveAttribute("href", "/sprites");
  expect(runtime.run).toHaveBeenCalledWith(expect.stringContaining("segments"));
});

test("pauses, resumes, and restarts from explicit controls", async () => {
  const user = userEvent.setup();
  const library = makeLibrary();
  await library.save({ draft: { title: "orbit", source: "game source" } });
  renderPage(library);
  await screen.findByRole("heading", { name: "orbit" });
  runtime.run.mockClear();

  await user.click(screen.getByRole("button", { name: "Pause" }));
  expect(runtime.stop).toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Resume" }));
  expect(runtime.run).toHaveBeenCalledWith("game source");
  await user.click(screen.getByRole("button", { name: "Restart" }));
  expect(runtime.stop).toHaveBeenCalledTimes(2);
  expect(runtime.run).toHaveBeenCalledTimes(2);
});

test("offers recovery when the saved cartridge no longer exists", async () => {
  renderPage(makeLibrary(), "missing");

  expect(await screen.findByRole("heading", { name: "Cartridge not found" })).toBeVisible();
  const recoveryLink = screen.getByRole("link", { name: "Open library" });
  expect(recoveryLink).toHaveAttribute("href", "/library");
  expect(recoveryLink).toHaveAttribute("data-cuelume-hover", "tick");
  expect(recoveryLink).toHaveAttribute("data-cuelume-press", "");
  expect(recoveryLink).toHaveAttribute("data-cuelume-release", "");
});

test("reports unavailable fullscreen without breaking play mode", async () => {
  const library = makeLibrary();
  await library.save({ draft: { title: "orbit", source: "game source" } });
  renderPage(library);
  await screen.findByRole("heading", { name: "orbit" });

  await userEvent.click(screen.getByRole("button", { name: "Enter fullscreen" }));

  expect(screen.getByRole("alert")).toHaveTextContent("Fullscreen is not available in this browser");
  expect(screen.getByRole("link", { name: "Open library" })).toBeVisible();
  expect(sound.play).toHaveBeenCalledWith("error");
});
