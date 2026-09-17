import { expect, type Page } from "@playwright/test";

export async function expectInstantInteractionColors(page: Page): Promise<void> {
  const animated = await page
    .locator('header, main, aside, footer, [role="dialog"], [role="menu"]')
    .evaluateAll((scopes) => {
      const interactive = new Set<Element>();
      for (const scope of scopes) {
        for (const element of scope.querySelectorAll('button, a[href], [role="menuitem"]')) {
          interactive.add(element);
        }
      }
      return [...interactive].flatMap((element) => {
        const style = getComputedStyle(element);
        const properties = style.transitionProperty.split(",").map((value) => value.trim());
        const durations = style.transitionDuration
          .split(",")
          .map((value) => Number.parseFloat(value));
        const changesColor = properties.some((property) =>
          ["all", "color", "background-color", "border-color"].includes(property),
        );
        if (!changesColor || durations.every((duration) => duration === 0)) return [];
        return [
          {
            label: (element.getAttribute("aria-label") ?? element.textContent ?? element.tagName)
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 60),
            transition: style.transition,
          },
        ];
      });
    });

  expect(animated).toEqual([]);
}

export function cartridge(source: string, title = "browser test") {
  return {
    format: "tynt",
    version: 1,
    title,
    author: "browser test",
    description: "An automated test cartridge.",
    controls: "No controls",
    source,
    canvas: { width: 160, height: 144 },
    palette: { model: "indexed", colors: ["#000000", "#555555", "#aaaaaa", "#ffffff"] },
  };
}

export async function importSource(page: Page, source: string, title?: string): Promise<void> {
  await page.locator("#file-input").setInputFiles({
    name: "fixture.tynt",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(cartridge(source, title))),
  });
}

export async function pixel(page: Page, x: number, y: number): Promise<number[]> {
  return page.locator("canvas").evaluate(
    (canvas: HTMLCanvasElement, point) => {
      return [...canvas.getContext("2d")!.getImageData(point.x, point.y, 1, 1).data];
    },
    { x, y },
  );
}
