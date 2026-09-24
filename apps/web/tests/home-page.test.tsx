// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { HomePage } from "@/pages/home-page";

afterEach(() => vi.restoreAllMocks());

test("chooses a gallery game per visit and keeps that choice while mounted", () => {
  const random = vi.spyOn(Math, "random").mockReturnValue(0);
  const home = () => (
    <MemoryRouter>
      <HomePage soundEnabled onSoundToggle={() => {}} />
    </MemoryRouter>
  );

  const firstVisit = render(home());
  const firstGame = screen.getByRole("link", { name: "About this game" }).getAttribute("href");
  random.mockReturnValue(0.999);
  firstVisit.rerender(home());
  expect(screen.getByRole("link", { name: "About this game" })).toHaveAttribute("href", firstGame);

  firstVisit.unmount();
  render(home());
  const nextGame = screen.getByRole("link", { name: "About this game" }).getAttribute("href");
  expect(nextGame).not.toBe(firstGame);
});
