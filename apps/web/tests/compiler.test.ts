import { describe, expect, test } from "vitest";
import { compileCartridge, mapGeneratedPosition } from "../src/runtime/compiler";
import { MAX_COMPILED_BYTES } from "../src/runtime/protocol";

const VALID = `type Count = number;
let count: Count = 0;
export function init(): void { count = 1; }
export function update(): void { count++; }
export function draw(): void { if (count > 2) throw new Error("boom"); }
`;

describe("cartridge compiler", () => {
  test("transforms a typed module into a self-contained cartridge IIFE", async () => {
    const result = await compileCartridge(VALID);
    expect(result.code).toContain("__tyntCartridge");
    expect(result.code).not.toContain("type Count");
    expect(result.map.length).toBeGreaterThan(0);
  });

  test.each(["init", "update", "draw"])("requires the %s lifecycle export", async (missing) => {
    const source = VALID.replace(new RegExp(`export function ${missing}[^}]+}`), "");
    await expect(compileCartridge(source)).rejects.toThrow(new RegExp(missing, "i"));
  });

  test("reports TypeScript syntax failures", async () => {
    await expect(compileCartridge(`${VALID}\nexport function broken(: void {}`)).rejects.toThrow(/cartridge\.ts|expected/i);
  });

  test.each([
    `import value from "remote";\n${VALID}`,
    `${VALID}\nasync function nope(){ return import("remote"); }`,
  ])("rejects package imports", async (source) => {
    await expect(compileCartridge(source)).rejects.toThrow(/imports/i);
  });

  test("enforces compiled JavaScript limit", async () => {
    const transform = async () => ({ code: "x".repeat(MAX_COMPILED_BYTES + 1), map: "{}" });
    await expect(compileCartridge(VALID, { transform })).rejects.toThrow(/1 MiB/i);
  });

  test("maps a generated throw back to TypeScript", async () => {
    const result = await compileCartridge(VALID);
    const lines = result.code.split("\n");
    const line = lines.findIndex((value) => value.includes('throw new Error("boom")')) + 1;
    const column = lines[line - 1]!.indexOf("throw");
    expect(mapGeneratedPosition(result.map, line, column)).toEqual({ line: 5, column: 47 });
  });
});
