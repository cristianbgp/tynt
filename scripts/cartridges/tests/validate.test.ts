import { describe, expect, test } from "bun:test";
import {
  parsePublishingMetadata,
  readPngDimensions,
  validateDirectoryEntries,
  validateSlug,
} from "../validate";

function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

describe("public cartridge validation", () => {
  test("accepts stable lowercase slugs and rejects ambiguous variants", () => {
    expect(validateSlug("tiny-dungeon")).toBe("tiny-dungeon");
    expect(() => validateSlug("Tiny--Dungeon")).toThrow(/lowercase letters, numbers, and single hyphens/);
    expect(() => validateSlug("_template")).toThrow(/lowercase letters, numbers, and single hyphens/);
  });

  test("normalizes known publishing metadata", () => {
    expect(parsePublishingMetadata('{"version":1,"tags":["arcade","two-button"],"license":"MIT"}')).toEqual({
      version: 1,
      tags: ["arcade", "two-button"],
      license: "MIT",
    });
  });

  test("accepts only MIT-licensed public cartridges", () => {
    expect(parsePublishingMetadata('{"version":1,"tags":["arcade"],"license":"MIT"}').license).toBe("MIT");
    expect(() => parsePublishingMetadata('{"version":1,"tags":["arcade"],"license":"Apache-2.0"}')).toThrow(
      /Unsupported license/,
    );
  });

  test("rejects publishing metadata that cannot be rendered safely", () => {
    expect(() => parsePublishingMetadata('{"version":1,"tags":["unknown"],"license":"MIT"}')).toThrow(/Unsupported tag/);
    expect(() => parsePublishingMetadata('{"version":1,"tags":["arcade","arcade"],"license":"MIT"}')).toThrow(/duplicate/);
    expect(() => parsePublishingMetadata('{"version":1,"tags":["arcade"],"license":"GPL-3.0"}')).toThrow(/Unsupported license/);
    expect(() => parsePublishingMetadata('{"version":1,"tags":["arcade"],"license":"MIT","repository":"http://example.com"}')).toThrow(/HTTPS/);
    expect(() => parsePublishingMetadata('{"version":1,"tags":["arcade"],"license":"MIT","featured":true}')).toThrow(/Unknown publishing field/);
  });

  test("reads dimensions from a real PNG header", () => {
    expect(readPngDimensions(pngHeader(160, 144))).toEqual({ width: 160, height: 144 });
    expect(() => readPngDimensions(new Uint8Array([1, 2, 3]))).toThrow(/valid PNG/);
  });

  test("allows only documented cartridge files", () => {
    expect(validateDirectoryEntries(["README.md", "cartridge.json", "cover.png", "game.tynt"])).toEqual([]);
    expect(validateDirectoryEntries(["game.tynt", "dist", "script.sh"])).toEqual([
      "Unexpected cartridge entry: dist",
      "Unexpected cartridge entry: script.sh",
    ]);
  });
});
