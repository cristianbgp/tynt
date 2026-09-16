import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ThemeToggle } from "@/components/docs/theme-toggle";

describe("documentation theme control", () => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let systemDark = false;

  beforeEach(() => {
    systemDark = false;
    listeners.clear();
    localStorage.clear();
    document.documentElement.className = "";
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.themePreference;
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((media: string) => ({
        matches: systemDark,
        media,
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
          listeners.add(listener),
        removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
          listeners.delete(listener),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  test("keeps server-rendered theme controls disabled until hydration", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<ThemeToggle />);
    const controls = container.querySelectorAll<HTMLButtonElement>('[role="radio"]');

    expect(controls).toHaveLength(3);
    for (const control of controls) expect(control).toBeDisabled();
  });

  test("persists all three choices and follows OS changes only in System mode", () => {
    render(<ThemeToggle />);

    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeVisible();
    expect(screen.getByRole("radio", { name: "System theme" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    fireEvent.click(screen.getByRole("radio", { name: "Dark theme" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("tynt-docs-theme")).toBe("dark");

    systemDark = true;
    for (const listener of listeners) listener({ matches: true } as MediaQueryListEvent);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    fireEvent.click(screen.getByRole("radio", { name: "Light theme" }));
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("tynt-docs-theme")).toBe("light");

    fireEvent.click(screen.getByRole("radio", { name: "System theme" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement).toHaveAttribute("data-theme-preference", "system");
    expect(localStorage.getItem("tynt-docs-theme")).toBe("system");
  });
});
