import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import type { DocsNavigationItem } from "@/lib/navigation";

const navigation: DocsNavigationItem[] = [
  { title: "Overview", url: "/docs" },
  { title: "Getting started", url: "/docs/getting-started" },
  {
    title: "Reference",
    children: [{ title: "Cartridge API", url: "/docs/reference/cartridge-api" }],
  },
];

describe("documentation navigation", () => {
  test("marks the current document without hiding grouped pages", () => {
    render(<DocsSidebar items={navigation} currentPath="/docs/getting-started" />);

    expect(screen.getByRole("navigation", { name: "Documentation" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Getting started" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Cartridge API" })).toHaveAttribute("href", "/docs/reference/cartridge-api");
  });
});
