import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const runtimeFiles = [
  "compiler.ts",
  "controller.ts",
  "iframe-source.ts",
  "protocol.ts",
  "renderer.ts",
  "sandbox.ts",
  "worker-source.ts",
];

describe("web package boundary", () => {
  test("browser runtime exists locally and imports core only through its public package", () => {
    const runtimeRoot = path.resolve(import.meta.dirname, "../src/runtime");
    const sources = runtimeFiles.map((file) => readFileSync(path.join(runtimeRoot, file), "utf8"));

    expect(sources.some((source) => source.includes('from "@tynt/core"'))).toBe(true);
    for (const source of sources) {
      expect(source).not.toMatch(/packages\/core\/src|\.\.\/\.\.\/\.\.\/packages\/core/);
    }
  });
});
