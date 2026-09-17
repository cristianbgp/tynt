import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseCartridge } from "../../../packages/core/src/cartridge";

const cartridgesDir = resolve(import.meta.dirname, "../../../cartridges");
const newerHelpers = [
  "seed",
  "random",
  "overlap",
  "pointInRect",
  "clamp",
  "wrap",
  "frame",
  "every",
  "after",
  "camera",
  "buttonReleased",
  "triangle",
  "tone",
  "sfx",
] as const;

async function publicSources(): Promise<Map<string, string>> {
  const entries = await readdir(cartridgesDir, { withFileTypes: true });
  const sources = new Map<string, string>();
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
    const cartridge = parseCartridge(
      await readFile(join(cartridgesDir, entry.name, "game.tynt"), "utf8"),
    );
    sources.set(entry.name, cartridge.source);
  }
  return sources;
}

describe("repository cartridge examples", () => {
  test("includes focused reaction and scrolling-adventure games", async () => {
    const sources = await publicSources();

    expect(sources.has("reaction")).toBe(true);
    expect(sources.has("tiny-quest")).toBe(true);
  });

  test("demonstrates every newer helper in at least two real cartridges", async () => {
    const sources = await publicSources();

    for (const helper of newerHelpers) {
      const pattern = new RegExp(`\\b${helper}\\s*\\(`);
      const examples = [...sources]
        .filter(([, source]) => pattern.test(source))
        .map(([slug]) => slug);
      expect(
        examples.length,
        `${helper} should have at least two cartridge examples`,
      ).toBeGreaterThanOrEqual(2);
    }
  });
});
