import { expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { generatePublicCartridges } from "../generate";

test("the repository discovers every cartridge through the contributor format", async () => {
  const root = resolve(import.meta.dirname, "../../..");
  const cartridgeDirectories = (await readdir(resolve(root, "cartridges"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
  const generated = await generatePublicCartridges({
    cartridgesDir: resolve(root, "cartridges"),
    outputFile: resolve(root, "apps/web/src/generated/public-cartridges.ts"),
    coverOutputDir: resolve(root, "apps/web/public/generated/cartridges"),
    check: true,
  });

  expect(generated.map(({ slug }) => slug)).toEqual(cartridgeDirectories);
  for (const cartridge of generated) {
    expect(cartridge.author.length).toBeGreaterThan(0);
    expect(cartridge.description.length).toBeGreaterThan(0);
    expect(cartridge.controls.length).toBeGreaterThan(0);
  }
});
