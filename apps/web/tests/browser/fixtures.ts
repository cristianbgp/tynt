import type { Page } from "@playwright/test";

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
