// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCartridgeLibrary, createMemoryAdapter } from "@/library/cartridge-library";
import type { CartridgeLibrary } from "@/library/cartridge-library";
import { LibraryPage } from "@/pages/library-page";

const playSound = vi.hoisted(() => vi.fn());
vi.mock("cuelume", () => ({ play: playSound }));

function makeLibrary() {
  let id = 0;
  let second = 0;
  return createCartridgeLibrary(createMemoryAdapter(), {
    createId: () => `local-${++id}`,
    now: () => new Date(Date.UTC(2026, 8, 14, 0, 0, ++second)).toISOString(),
  });
}

const source = "export function init(){} export function update(){} export function draw(){}";

function renderPage(library = makeLibrary()) {
  render(
    <MemoryRouter>
      <LibraryPage library={library} soundEnabled onSoundToggle={() => {}} />
    </MemoryRouter>,
  );
  return library;
}

describe("local library page", () => {
  beforeEach(() => vi.clearAllMocks());

  test("shows an empty-state path to create and browse cartridges", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Your library is empty" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Create a cartridge" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Browse examples" })).toHaveAttribute("href", "/gallery");
  });

  test("shows storage failures without replacing the library shell", async () => {
    const failure = async () => { throw new Error("Local storage is unavailable"); };
    const library: CartridgeLibrary = {
      list: failure,
      get: failure,
      save: failure,
      duplicate: failure,
      remove: failure,
    };
    renderPage(library);

    expect(await screen.findByRole("alert")).toHaveTextContent("Local storage is unavailable");
    expect(screen.getByRole("heading", { name: "Your library" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Your library is empty" })).not.toBeInTheDocument();
  });

  test("lists recent cartridges and searches all descriptive metadata", async () => {
    const library = makeLibrary();
    await library.save({ draft: { title: "snake", source, author: "ana", description: "grid game", controls: "Arrows steer" } });
    await library.save({ draft: { title: "orbit", source, author: "cris", description: "space game", controls: "A fires" } });
    renderPage(library);

    expect((await screen.findAllByRole("article")).map((card) => card.textContent)).toEqual([
      expect.stringContaining("orbit"),
      expect.stringContaining("snake"),
    ]);
    await userEvent.type(screen.getByRole("searchbox", { name: "Search library" }), "ARROWS");
    expect(screen.getByRole("article")).toHaveTextContent("snake");
    expect(screen.queryByText("orbit.tynt")).not.toBeInTheDocument();
  });

  test("duplicates and deletes cartridges with immediate feedback", async () => {
    const library = makeLibrary();
    const original = await library.save({ draft: { title: "orbit", source } });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage(library);

    await userEvent.click(await screen.findByRole("button", { name: "Duplicate orbit" }));
    expect(await screen.findByText("orbit-copy.tynt")).toBeVisible();
    expect(playSound).toHaveBeenCalledWith("success");

    await userEvent.click(screen.getByRole("button", { name: "Delete orbit" }));
    await waitFor(() => expect(screen.queryByText("orbit.tynt")).not.toBeInTheDocument());
    expect(await library.get(original.id)).toBeUndefined();
  });

  test("renames and updates cartridge details without leaving the library", async () => {
    const library = makeLibrary();
    await library.save({ draft: { title: "orbit", source } });
    renderPage(library);

    await userEvent.click(await screen.findByRole("button", { name: "Edit details for orbit" }));
    await userEvent.clear(screen.getByRole("textbox", { name: "Title" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Title" }), "new orbit");
    await userEvent.click(screen.getByRole("button", { name: "Save details" }));

    expect(await screen.findByText("new-orbit.tynt")).toBeVisible();
    expect((await library.list())[0]?.title).toBe("new orbit");
  });
});
