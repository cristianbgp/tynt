import { describe, expect, test } from "vitest";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const docsRoot = process.cwd();

async function packageManifest() {
  return JSON.parse(await readFile(resolve(docsRoot, "package.json"), "utf8"));
}

describe("custom documentation application", () => {
  test("uses the custom Next.js and headless Fumadocs stack", async () => {
    const manifest = await packageManifest();

    expect(manifest.scripts).toMatchObject({
      dev: "bun run generate:api && bun run --bun next dev --webpack --hostname 127.0.0.1 --port ${TYNT_DOCS_PORT:-4174}",
      build: "bun run generate:api && bun run --bun next build --webpack",
      start: "bun run --bun next start --hostname 127.0.0.1 --port ${TYNT_DOCS_PORT:-4174}",
    });
    for (const dependency of [
      "next",
      "react",
      "react-dom",
      "fumadocs-core",
      "fumadocs-mdx",
      "tailwindcss",
      "@tailwindcss/postcss",
      "pixelarticons",
      "@radix-ui/react-dialog",
    ]) {
      expect({ ...manifest.dependencies, ...manifest.devDependencies }).toHaveProperty(dependency);
    }
    expect(manifest.devDependencies).not.toHaveProperty("typedoc");
  });

  test("provides the files required by the App Router and MDX compiler", () => {
    for (const path of [
      "app/layout.tsx",
      "app/page.tsx",
      "app/globals.css",
      "next.config.ts",
      "postcss.config.mjs",
      "source.config.ts",
      "tsconfig.json",
    ]) {
      expect(existsSync(resolve(docsRoot, path))).toBe(true);
    }
  });
});
