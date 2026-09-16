import { describe, expect, test } from "vitest";
import {
  copyPublicDraft,
  findPublicCartridge,
  listPublicCartridges,
} from "@/cartridges/public-cartridges";
import { compileCartridge } from "@/runtime/compiler";

describe("public cartridge catalog", () => {
  test("finds a public cartridge by exact stable slug", () => {
    expect(findPublicCartridge("snake")?.filename).toBe("snake.tynt");
    expect(findPublicCartridge("SNAKE")).toBeUndefined();
    expect(findPublicCartridge("missing")).toBeUndefined();
  });

  test("returns a draft copy without publishing fields", () => {
    const cartridge = findPublicCartridge("starter")!;
    const draft = copyPublicDraft(cartridge);
    expect(draft).toEqual({
      title: cartridge.title,
      source: cartridge.source,
      author: cartridge.author,
      description: cartridge.description,
      controls: cartridge.controls,
    });
    expect(draft).not.toHaveProperty("slug");
    expect(draft).not.toHaveProperty("tags");
  });

  test("exposes the generated collection in deterministic order", () => {
    const slugs = listPublicCartridges().map(({ slug }) => slug);
    expect(slugs).toEqual([...slugs].sort());
  });

  test("compiles every repository cartridge", async () => {
    for (const cartridge of listPublicCartridges()) {
      await expect(compileCartridge(cartridge.source), cartridge.filename).resolves.toMatchObject({
        code: expect.stringContaining("__tyntCartridge"),
      });
    }
  });
});
