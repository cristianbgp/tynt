import { describe, expect, test } from "vitest";
import { frequencyForNote, soundCode } from "@/sound-editor";

describe("sound editor model", () => {
  test("maps named notes to stable cartridge frequencies", () => {
    expect(frequencyForNote("C4")).toBe(261.63);
    expect(frequencyForNote("A4")).toBe(440);
    expect(frequencyForNote("C6")).toBe(1046.5);
  });

  test("generates paste-ready sfx code while preserving rests", () => {
    expect(soundCode([261.63, 0, 329.63], 80, 0.15, "square")).toBe(
      'const sound = [261.63, 0, 329.63] as const;\n\n// play with:\nsfx(sound, 80, 0.15, "square");',
    );
  });
});
