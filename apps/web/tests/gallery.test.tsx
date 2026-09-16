// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, test } from "vitest";
import { GalleryPage } from "@/pages/gallery-page";

function renderGallery() {
  return render(
    <MemoryRouter initialEntries={["/gallery"]}>
      <GalleryPage />
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
    expect(screen.getByRole("link", { name: "Play snake.tynt" })).toHaveAttribute(
      "href",
      "/play/public/snake",
    );
    expect(screen.getByRole("link", { name: "Open snake.tynt in editor" })).toHaveAttribute(
      "href",
      "/?cartridge=snake",
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
});
