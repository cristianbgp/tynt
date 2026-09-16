// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { createCartridgeLibrary, createMemoryAdapter, type CartridgeLibrary } from "@/library/cartridge-library";

const sound = vi.hoisted(() => ({
  bind: vi.fn(),
  play: vi.fn(),
  setEnabled: vi.fn(),
}));

vi.mock("cuelume", () => sound);

const runtime = vi.hoisted(() => {
  const debugSnapshot = { frame: 0, held: [], pressed: [] };
  return {
    canvasRef: () => {},
    status: "ready",
    error: "",
    showPreviewError: false,
    isRunning: false,
    isCompiling: false,
    isPaused: false,
    debugStore: {
      getSnapshot: () => debugSnapshot,
      subscribe: () => () => {},
      update: vi.fn(),
    },
    run: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    step: vi.fn(),
    setKey: vi.fn(() => false),
    setInput: vi.fn(),
    resetInput: vi.fn(),
    clearError: vi.fn(),
    reportError: vi.fn(),
    announce: vi.fn(),
  };
});

vi.mock("@/hooks/use-runtime", () => ({
  useRuntime: () => runtime,
}));

import { App } from "@/app";

async function renderApp(library?: CartridgeLibrary) {
  const result = render(
    <MemoryRouter initialEntries={[`${window.location.pathname}${window.location.search}`]}>
      <App library={library} />
    </MemoryRouter>,
  );
  await waitFor(
    () => expect(screen.queryByText("Loading tynt…")).not.toBeInTheDocument(),
    { timeout: 10_000 },
  );
  return result;
}

describe("tynt creator shell", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
    runtime.error = "";
    runtime.showPreviewError = false;
    vi.clearAllMocks();
    runtime.run.mockResolvedValue(true);
  });

  test("shows the creator and accessible toolbar shortcuts", async () => {
    await renderApp();

    expect(screen.getByText("tynt")).toBeVisible();
    const primaryNavigation = screen.getByRole("navigation", { name: "Primary navigation" });
    expect(within(primaryNavigation).getByRole("link", { name: "Editor" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("navigation", { name: "Cartridge actions" })).toBeVisible();
    const brand = screen.getByRole("link", { name: "tynt editor" });
    expect(brand.querySelector(".brand-mark")).toBeVisible();
    expect(brand.querySelector(".brand-wordmark")).toHaveTextContent("tynt");
    expect(screen.queryByRole("textbox", { name: "Cartridge title" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Current cartridge file")).toHaveTextContent("starter.tynt");
    expect(screen.getByRole("button", { name: "Examples" })).toBeVisible();
    expect(screen.getByRole("button", { name: /run/i })).toHaveAttribute(
      "aria-keyshortcuts",
      "Control+Shift+Enter",
    );
    expect(screen.getByRole("button", { name: /import/i })).toHaveAttribute("aria-keyshortcuts", "Control+O Meta+O");
    expect(screen.getByRole("button", { name: /export/i })).toHaveAttribute("aria-keyshortcuts", "Control+S Meta+S");
    expect(screen.getByRole("button", { name: "Run" })).toHaveAttribute("data-cuelume-hover", "tick");
    expect(screen.getByRole("button", { name: "Run" }).querySelector('[data-icon="play"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import" }).querySelector('[data-icon="upload"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" }).querySelector('[data-icon="download"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sound on" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Sound on" })).toHaveAttribute("data-cuelume-hover", "tick");
    expect(screen.getByRole("button", { name: "Sound on" }).querySelector('[data-icon="volume"]')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "made by @cristianbgp" })).toHaveAttribute("href", "https://cristianbgp.com");
    expect(screen.getByRole("link", { name: "made by @cristianbgp" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "made by @cristianbgp" })).toHaveAttribute("rel", "noreferrer");
    expect(screen.getByRole("link", { name: "Open tynt on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/cristianbgp/tynt",
    );
    expect(screen.getByRole("link", { name: "Open tynt documentation" })).toHaveAttribute(
      "href",
      "https://docs.tynt.dev",
    );
    expect(screen.getByRole("link", { name: "Open tynt on GitHub" }).querySelector('[data-icon="github"]')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open tynt documentation" }).querySelector('[data-icon="docs"]')).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Game preview" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("ready");
  });

  test("renders the cartridge gallery at its own route", async () => {
    window.history.replaceState({}, "", "/gallery");

    await renderApp();

    expect(screen.getByRole("heading", { name: "Cartridge gallery" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "Game preview" })).not.toBeInTheDocument();
  });

  test("renders the sprite editor at its own route", async () => {
    window.history.replaceState({}, "", "/sprites");
    await renderApp();
    expect(screen.getByRole("heading", { name: "Sprite editor" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Pixel 1, 1 color 0" })).toHaveAttribute("data-cuelume-hover", "tick");
    expect(screen.getByRole("button", { name: "Color 0" })).toHaveAttribute("data-cuelume-hover", "tick");
  });

  test("renders the sound editor at its own route", async () => {
    window.history.replaceState({}, "", "/sounds");
    await renderApp();
    expect(screen.getByRole("heading", { name: "Sound editor" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Sounds" })).toHaveAttribute("aria-current", "page");
  });

  test("offers a route back to the editor for unknown paths", async () => {
    window.history.replaceState({}, "", "/missing");

    await renderApp();

    expect(screen.getByRole("heading", { name: "Page not found" })).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    expect(document.querySelector(".state-mark .brand-mark")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open editor" })).toHaveAttribute("href", "/");
  });

  test("loads a saved local cartridge into the editor", async () => {
    const library = createCartridgeLibrary(createMemoryAdapter(), {
      createId: () => "local-one",
      now: () => "2026-09-14T00:00:00.000Z",
    });
    await library.save({ draft: { title: "local game", source: "const localMarker = true;" } });
    window.history.replaceState({}, "", "/?local=local-one");

    await renderApp(library);

    expect(await screen.findByLabelText("Current cartridge file")).toHaveTextContent("local-game.tynt");
    expect(document.querySelector(".cm-content")).toHaveTextContent("localMarker");
  });

  test("opens a public cartridge through the canonical editor query", async () => {
    window.history.replaceState({}, "", "/?cartridge=snake");

    await renderApp();

    expect(screen.getByLabelText("Current cartridge file")).toHaveTextContent("snake.tynt");
    expect(document.querySelector(".cm-content")).toHaveTextContent("segments");
  });

  test("saves the current editor draft into the local library", async () => {
    const library = createCartridgeLibrary(createMemoryAdapter(), {
      createId: () => "saved-one",
      now: () => "2026-09-14T00:00:00.000Z",
    });
    await renderApp(library);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(async () => expect((await library.list()).map((record) => record.id)).toEqual(["saved-one"]));
    expect(screen.getByText("saved to library")).toBeVisible();
  });

  test("focuses the preview after a run starts", async () => {
    await renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(document.querySelector("#preview")).toHaveFocus());
    expect(screen.getByRole("button", { name: "Show game" })).toHaveAttribute("aria-pressed", "true");
  });

  test("offers an accessible mobile workspace switch", async () => {
    await renderApp();

    const code = screen.getByRole("button", { name: "Show code" });
    const game = screen.getByRole("button", { name: "Show game" });
    expect(code).toHaveAttribute("aria-pressed", "true");
    expect(game).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(game);
    expect(code).toHaveAttribute("aria-pressed", "false");
    expect(game).toHaveAttribute("aria-pressed", "true");
    expect(game).toHaveAttribute("data-cuelume-toggle", "");
  });

  test("keeps the code pane selected when a run cannot start", async () => {
    runtime.run.mockResolvedValueOnce(false);
    await renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(runtime.run).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Show code" })).toHaveAttribute("aria-pressed", "true");
  });

  test("loads an editable copy from the examples dropdown", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole("button", { name: "Examples" }));
    expect(screen.queryByRole("menuitem", { name: "cube-animation.tynt" })).not.toBeInTheDocument();
    const shapes = await screen.findByRole("menuitem", { name: "shapes.tynt" });
    expect(shapes).toHaveAttribute("data-cuelume-hover", "tick");
    expect(shapes).toHaveAttribute("data-cuelume-toggle", "");
    await user.click(shapes);

    expect(screen.getByLabelText("Current cartridge file")).toHaveTextContent("shapes.tynt");
    expect(document.querySelector(".cm-content")).toHaveTextContent("circle(");
    expect(runtime.stop).toHaveBeenCalledOnce();
  });

  test("disables silently and confirms only after sound is enabled again", async () => {
    await renderApp();
    sound.play.mockClear();
    sound.setEnabled.mockClear();

    const enabledButton = screen.getByRole("button", { name: "Sound on" });
    expect(enabledButton).not.toHaveAttribute("data-cuelume-toggle");
    fireEvent.click(enabledButton);

    expect(screen.getByRole("button", { name: "Sound off" })).toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem("tynt:sound-enabled")).toBe("false");
    expect(sound.setEnabled).toHaveBeenLastCalledWith(false);
    expect(sound.play).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Sound off" }));

    expect(screen.getByRole("button", { name: "Sound on" })).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem("tynt:sound-enabled")).toBe("true");
    expect(sound.setEnabled).toHaveBeenCalledWith(true);
    expect(sound.play).toHaveBeenCalledWith("toggle");
    expect(sound.setEnabled.mock.invocationCallOrder.at(-2)).toBeLessThan(sound.play.mock.invocationCallOrder[0]);
  });

  test("plays the error cue when a new user-triggered error is shown", async () => {
    runtime.error = "compile failed";

    await renderApp();

    expect(sound.play).toHaveBeenCalledWith("error");
  });
});
