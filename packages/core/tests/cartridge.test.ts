import { describe, expect, test } from "bun:test";
import {
  MAX_AUTHOR_CODE_POINTS,
  MAX_CONTROLS_CODE_POINTS,
  MAX_DESCRIPTION_CODE_POINTS,
  MAX_SOURCE_BYTES,
  parseCartridge,
  safeFilename,
  serializeCartridge,
  type TyntCartridgeV1,
} from "../src";

function validCartridge(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    format: "tynt",
    version: 1,
    title: "demo",
    author: "maker",
    description: "A small game.",
    controls: "A acts",
    source: "export function init(){}\nexport function update(){}\nexport function draw(){}",
    canvas: { width: 160, height: 144 },
    palette: { model: "indexed", colors: ["#000000", "#555555", "#aaaaaa", "#ffffff"] },
    ...overrides,
  };
}

describe("cartridge validation", () => {
  test("rejects a blank cartridge title", () => {
    expect(() => parseCartridge(JSON.stringify(validCartridge({ title: "  " })))).toThrow(/title.*required/i);
  });

  test.each([0, 2, "1"])("rejects unsupported version %p", (version) => {
    expect(() => parseCartridge(JSON.stringify(validCartridge({ version })))).toThrow(/version/i);
  });

  test("rejects invalid fixed metadata", () => {
    expect(() => parseCartridge(JSON.stringify(validCartridge({ canvas: { width: 320, height: 144 } })))).toThrow(/canvas/i);
  });

  test("rejects source above 256 KiB by UTF-8 bytes", () => {
    expect(new TextEncoder().encode("é".repeat(131_073)).byteLength).toBeGreaterThan(MAX_SOURCE_BYTES);
    expect(() => parseCartridge(JSON.stringify(validCartridge({ source: "é".repeat(131_073) })))).toThrow(/256 KiB/i);
  });

  test("rejects titles over 120 Unicode code points", () => {
    expect(() => parseCartridge(JSON.stringify(validCartridge({ title: "🎮".repeat(121) })))).toThrow(/120/i);
  });

  test.each([
    [{ future: true }, /unknown cartridge field.*future/i],
    [{ canvas: { width: 160, height: 144, future: true } }, /unknown canvas field.*future/i],
    [{ palette: { model: "indexed", colors: ["#000000", "#555555", "#aaaaaa", "#ffffff"], future: true } }, /unknown palette field.*future/i],
  ])("rejects unknown properties in the fixed v1 shape", (override, message) => {
    expect(() => parseCartridge(JSON.stringify(validCartridge(override)))).toThrow(message);
  });

  test.each([
    ["Hello world", "hello-world.tynt"],
    ["../../", "untitled.tynt"],
    [" Týnt Demo! ", "tynt-demo.tynt"],
  ])("creates a safe filename from %s", (title, expected) => {
    expect(safeFilename(title)).toBe(expected);
  });

  test("serialize creates fixed metadata from a draft", () => {
    const value = JSON.parse(serializeCartridge({
      title: "demo",
      author: "maker",
      description: "A small game.",
      controls: "A acts",
      source: "code",
    })) as TyntCartridgeV1;
    expect(value.canvas).toEqual({ width: 160, height: 144 });
    expect(value.palette.colors).toEqual(["#000000", "#555555", "#aaaaaa", "#ffffff"]);
  });

  test("round trips trimmed required cartridge metadata", () => {
    const value = parseCartridge(serializeCartridge({
      title: "demo",
      source: "code",
      author: "  cristianbgp  ",
      description: "  A tiny game.  ",
      controls: "  Arrows move · A jumps  ",
    }));

    expect(value).toMatchObject({
      author: "cristianbgp",
      description: "A tiny game.",
      controls: "Arrows move · A jumps",
    });
  });

  test.each(["title", "author", "description", "controls", "source"])('rejects missing or blank required field "%s"', (field) => {
    const missing = validCartridge();
    delete missing[field];
    expect(() => parseCartridge(JSON.stringify(missing))).toThrow(new RegExp(`${field}.*required`, "i"));
    expect(() => parseCartridge(JSON.stringify(validCartridge({ [field]: "  " })))).toThrow(new RegExp(`${field}.*required`, "i"));
  });

  test("rejects exporting an incomplete local draft", () => {
    expect(() => serializeCartridge({ title: "demo", source: "code" })).toThrow(/author.*required/i);
  });

  test.each([
    ["author", "🎮".repeat(MAX_AUTHOR_CODE_POINTS + 1), /author/i],
    ["description", "🎮".repeat(MAX_DESCRIPTION_CODE_POINTS + 1), /description/i],
    ["controls", "🎮".repeat(MAX_CONTROLS_CODE_POINTS + 1), /controls/i],
    ["author", 42, /author/i],
  ])("rejects invalid %s metadata", (field, value, message) => {
    expect(() => parseCartridge(JSON.stringify(validCartridge({ [field]: value })))).toThrow(message);
  });
});
