import { describe, expect, test } from "vitest";
import { CARTRIDGE_API_NAMES } from "@tynt/core";
import { generateApiDocument } from "../scripts/generate-api";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const contentRoot = resolve(process.cwd(), "content/docs");
const pageFiles = [
  "index.mdx",
  "getting-started.mdx",
  "examples.mdx",
  "cartridge-files.mdx",
  "publishing.mdx",
  "security.mdx",
  "reference/cartridge-api.mdx",
] as const;

describe("documentation content", () => {
  test("keeps every creator guide in ordered repository MDX", async () => {
    const metadata = JSON.parse(await readFile(resolve(contentRoot, "meta.json"), "utf8"));

    expect(metadata.pages).toEqual([
      "index",
      "getting-started",
      "examples",
      "cartridge-files",
      "publishing",
      "security",
      "reference",
    ]);

    for (const path of pageFiles) {
      const markdown = await readFile(resolve(contentRoot, path), "utf8");
      expect(markdown).toMatch(/^---\ntitle: .+\ndescription: .+\n---/);
      expect(markdown).not.toMatch(/\bTynt\b/);
    }
  });

  test("generates every cartridge API entry as MDX", () => {
    const markdown = generateApiDocument();

    expect(markdown).toContain("title: Cartridge API");
    expect(markdown).toContain("description: The complete API available to every cartridge.");
    for (const name of CARTRIDGE_API_NAMES) expect(markdown).toContain(`### \`${name}\``);
  });
});
