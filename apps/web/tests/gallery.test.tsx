// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, test } from "vitest";
import { GalleryPage } from "@/pages/gallery-page";

function renderGallery() {
  return render(
    <MemoryRouter initialEntries={["/gallery"]}>
      <GalleryPage />
    </MemoryRouter>,
  );
}

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function renderNavigableGallery() {
  return render(
    <MemoryRouter initialEntries={["/gallery"]}>
      <GalleryPage />
      <CurrentPath />
    </MemoryRouter>,
  );
}

describe("cartridge gallery", () => {
  test("shows repository cartridges with play and remix routes", () => {
    renderGallery();
    expect(screen.getByRole("heading", { name: "Cartridge gallery" })).toBeVisible();
    const previews = screen.getAllByRole("img", { name: /preview$/i });
    expect(previews[0]).toHaveAttribute("width", "320");
    expect(previews[0]).toHaveAttribute("height", "288");
    const publicationDates = [...document.querySelectorAll("time")].map((element) =>
      element.getAttribute("datetime"),
    );
    expect(publicationDates).toEqual([...publicationDates].sort().reverse());
    expect(screen.getByRole("link", { name: "Play snake.tynt" })).toHaveAttribute(
      "href",
      "/play/public/snake",
    );
    expect(screen.getByRole("link", { name: "Open snake.tynt in editor" })).toHaveAttribute(
      "href",
      "/editor?cartridge=snake",
    );
    expect(screen.getByRole("link", { name: "Submit a cartridge" })).toHaveAttribute(
      "data-cuelume-hover",
      "tick",
    );
  });

  test("searches public metadata and reports empty results", async () => {
    const user = userEvent.setup();
    renderGallery();
    const search = screen.getByRole("searchbox", { name: "Search cartridges" });
    await user.type(search, "procedural terrain");
    expect(screen.getByRole("heading", { name: "lunar.tynt" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "snake.tynt" })).not.toBeInTheDocument();
    await user.clear(search);
    await user.type(search, "nothing matches this");
    expect(screen.getByText(/No public cartridges match/)).toBeVisible();
  });

  test("filters by a cartridge tag and lets the user clear it", async () => {
    const user = userEvent.setup();
    renderGallery();
    const puzzle = screen.getByRole("button", { name: "puzzle" });
    await user.click(puzzle);
    expect(puzzle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "sokoban.tynt" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "snake.tynt" })).not.toBeInTheDocument();
    await user.click(puzzle);
    expect(screen.getByRole("heading", { name: "snake.tynt" })).toBeVisible();
  });

  test("sorts visible cartridges by title", async () => {
    const user = userEvent.setup();
    renderGallery();

    await user.click(screen.getByRole("button", { name: "Sort: Newest" }));
    await user.click(await screen.findByRole("menuitem", { name: "Title" }));

    const titles = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent ?? "");
    expect(titles).toEqual([...titles].sort((left, right) => left.localeCompare(right)));
    expect(screen.getByRole("button", { name: "Sort: Title" })).toBeVisible();
  });

  test("uses card tags as filters and reports the visible result count", async () => {
    const user = userEvent.setup();
    renderGallery();

    await user.click(screen.getByRole("button", { name: "Filter by puzzle from sokoban.tynt" }));

    const visibleGames = screen.getAllByRole("article").length;
    expect(screen.getByText(`${visibleGames} games`)).toBeVisible();
    expect(screen.getByRole("heading", { name: "sokoban.tynt" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "tiny-quest.tynt" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "snake.tynt" })).not.toBeInTheDocument();
  });

  test("opens a random game from the currently visible results", async () => {
    const user = userEvent.setup();
    renderNavigableGallery();

    await user.type(screen.getByRole("searchbox", { name: "Search cartridges" }), "lunar");
    await user.click(screen.getByRole("button", { name: "Random game" }));

    expect(screen.getByRole("status", { name: "Current path" })).toHaveTextContent(
      "/play/public/lunar",
    );
  });
});
