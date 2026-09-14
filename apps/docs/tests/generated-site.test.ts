import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { CARTRIDGE_API_NAMES } from "@tynt/core";
import { generateApiDocument } from "../scripts/generate-api";

const docsRoot = new URL("..", import.meta.url).pathname;
const outputDirectory = join(docsRoot, "dist");

async function htmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return htmlFiles(path);
      return path.endsWith(".html") ? [path] : [];
    }),
  );
  return nested.flat();
}

describe("generated documentation", () => {
  test("contains the guide, public API, and tynt theme", async () => {
    const files = await htmlFiles(outputDirectory);
    const html = (await Promise.all(files.map((file) => Bun.file(file).text()))).join("\n");

    expect(html).toContain("Getting Started");
    expect(html).toContain("PixelSurface");
    expect(html).toContain("custom.css");
    for (const title of ["Create tiny games with tynt", "Getting Started", "Cartridge API", "Examples and Recipes", "Cartridge Files", "Publishing", "Security", "Engine"]) {
      expect(html).toContain(title);
    }
    expect(html).not.toContain("content_overview.html");
  });

  test("generates every creator API entry from the shared catalog", () => {
    const markdown = generateApiDocument();
    for (const name of CARTRIDGE_API_NAMES) expect(markdown).toContain(`### \`${name}\``);
    expect(markdown).toContain("## Drawing");
    expect(markdown).toContain("clear(color = 0)");
    expect(markdown).toContain("tone(frequency, duration = 100");
  });

  test("publishes a monochrome syntax palette for light and dark themes", async () => {
    const css = await Bun.file(join(outputDirectory, "assets/custom.css")).text();
    const highlightColors = [...css.matchAll(/--(?:light|dark)-hl-\d:\s*(#[0-9a-f]{6})/gi)]
      .map((match) => match[1].toLowerCase());

    expect(highlightColors).toHaveLength(20);
    expect(highlightColors.every((color) => color.slice(1, 3) === color.slice(3, 5)
      && color.slice(3, 5) === color.slice(5, 7))).toBe(true);
  });

  test("is coordinated by the root package", async () => {
    const rootPackage = await Bun.file(new URL("../../../package.json", import.meta.url)).json();

    expect(rootPackage.scripts["docs:dev"]).toBe("bun run --cwd apps/docs dev");
    expect(rootPackage.scripts["docs:build"]).toBe("bun run --cwd apps/docs build");
    expect(rootPackage.scripts["install:all"]).toContain("bun install --cwd apps/docs");
    expect(rootPackage.scripts.build).toContain("bun run docs:build");
  });
});
