import { describe, expect, test } from "vitest";
import {
  MAX_COMMANDS,
  MAX_FRAME_BYTES,
  encodedBytes,
  newRunToken,
  parseHostMessage,
  parseIframeMessage,
  validateFrame,
} from "../src/runtime/protocol";

const token = "0123456789abcdef0123456789abcdef";

describe("sandbox protocol", () => {
  test("creates 128-bit hexadecimal run tokens", () => {
    const first = newRunToken();
    const second = newRunToken();
    expect(first).toMatch(/^[0-9a-f]{32}$/);
    expect(second).not.toBe(first);
  });

  test("accepts valid host messages and rejects stale or malformed ones", () => {
    expect(parseHostMessage({ kind: "tick", token, input: { held: ["left"], pressed: ["a"] } }, token)).toEqual({
      kind: "tick", token, input: { held: ["left"], pressed: ["a"] },
    });
    expect(() => parseHostMessage({ kind: "stop", token: "stale" }, token)).toThrow(/token/i);
    expect(() => parseHostMessage({ kind: "tick", token, input: { held: ["nope"], pressed: [] } }, token)).toThrow(/input/i);
  });

  test("accepts valid iframe messages and rejects invalid numeric data", () => {
    expect(parseIframeMessage({ kind: "frame", token, commands: [{ op: "pixel", x: 1, y: 2, color: 3 }] }, token)).toEqual({
      kind: "frame", token, commands: [{ op: "pixel", x: 1, y: 2, color: 3 }],
    });
    expect(() => parseIframeMessage({ kind: "frame", token, commands: [{ op: "pixel", x: NaN, y: 2, color: 3 }] }, token)).toThrow(/command/i);
    expect(() => parseIframeMessage({ kind: "frame", token, commands: [{ op: "pixel", x: Infinity, y: 2, color: 3 }] }, token)).toThrow(/command/i);
  });

  test("validates lifecycle phase and normalized errors", () => {
    expect(parseIframeMessage({ kind: "phase", token, phase: "update", state: "begin" }, token).kind).toBe("phase");
    expect(parseIframeMessage({ kind: "error", token, phase: "draw", message: "boom", line: 8, column: 2 }, token).kind).toBe("error");
    expect(() => parseIframeMessage({ kind: "error", token, phase: "internal", message: "boom" }, token)).toThrow(/phase/i);
  });

  test("accepts bounded cartridge audio and rejects unsafe values", () => {
    expect(parseIframeMessage({ kind: "audio", token, frequency: 440, duration: 120, volume: 0.2, wave: "square", delay: 0 }, token)).toEqual({
      kind: "audio", token, frequency: 440, duration: 120, volume: 0.2, wave: "square", delay: 0,
    });
    expect(() => parseIframeMessage({ kind: "audio", token, frequency: Infinity, duration: 120, volume: 1, wave: "square", delay: 0 }, token)).toThrow(/audio/i);
    expect(() => parseIframeMessage({ kind: "audio", token, frequency: 440, duration: 99_999, volume: 1, wave: "square", delay: 0 }, token)).toThrow(/audio/i);
  });

  test("enforces command count and text code-point limits", () => {
    const atLimit = Array.from({ length: MAX_COMMANDS }, () => ({ op: "clear" as const, color: 0 }));
    expect(validateFrame(atLimit)).toHaveLength(MAX_COMMANDS);
    expect(() => validateFrame([...atLimit, { op: "clear", color: 0 }])).toThrow(/32,768/);
    expect(() => validateFrame([{ op: "text", value: "🎮".repeat(1025), x: 0, y: 0, color: 1 }])).toThrow(/1,024/);
  });

  test("bounds sprite and map rendering work", () => {
    expect(validateFrame([{ op: "sprite", pixels: [1, 2, 3, 0], width: 2, height: 2, x: 0, y: 0, transparent: 0 }])).toHaveLength(1);
    expect(() => validateFrame([{ op: "sprite", pixels: [1], width: 160, height: 144, x: 0, y: 0, transparent: 0 }])).toThrow(/sprite/i);
    expect(() => validateFrame([{ op: "map", tiles: Array(1025).fill(0), columns: 1, tileWidth: 8, tileHeight: 8, spritesheet: Array(64).fill(1), sheetColumns: 1, x: 0, y: 0, transparent: 0 }])).toThrow(/map/i);
  });

  test("counts encoded UTF-8 and enforces the frame byte limit", () => {
    expect(encodedBytes("é")).toBe(4);
    const oversized = Array.from({ length: 1024 }, () => ({ op: "text" as const, value: "x".repeat(1024), x: 0, y: 0, color: 1 }));
    expect(() => validateFrame(oversized)).toThrow(/1 MiB/);
    expect(() => parseIframeMessage({ kind: "frame", token, commands: [], ignored: "x".repeat(MAX_FRAME_BYTES) }, token)).toThrow(/1 MiB/);
  });
});
