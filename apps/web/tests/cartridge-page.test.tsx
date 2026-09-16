// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, test } from "vitest";
import { CartridgePage } from "@/pages/cartridge-page";

function renderRoute(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/cartridges/${slug}`]}>
      <Routes>
        <Route
          path="cartridges/:slug"
          element={<CartridgePage soundEnabled onSoundToggle={() => {}} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

test("shows a public cartridge with canonical actions and repository content", () => {
  renderRoute("starter");

  expect(screen.getByRole("heading", { level: 1, name: "starter" })).toBeVisible();
  expect(screen.getByText("starter.tynt")).toBeVisible();
  expect(screen.getByText("MIT")).toBeVisible();
  expect(screen.getByText("Sep 14, 2026")).toHaveAttribute("datetime", "2026-09-14");
  expect(screen.getByRole("link", { name: "Play starter" })).toHaveAttribute(
    "href",
    "/play/public/starter",
  );
  expect(screen.getByRole("link", { name: "Remix starter" })).toHaveAttribute(
    "href",
    "/?cartridge=starter",
  );
  expect(screen.getByRole("link", { name: "View starter on GitHub" })).toHaveAttribute(
    "rel",
    "noreferrer",
  );
  expect(screen.getByRole("heading", { level: 2, name: "About this cartridge" })).toBeVisible();
  expect(screen.getByRole("heading", { level: 2, name: "Source" })).toBeVisible();
  expect(screen.getByText(/export function update/)).toBeVisible();
});

test("offers the gallery when a cartridge slug is unknown", () => {
  renderRoute("does-not-exist");

  expect(screen.getByRole("heading", { name: "Cartridge not found" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Open gallery" })).toHaveAttribute("href", "/gallery");
});
