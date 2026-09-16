import type { AudioWave } from "@/runtime/protocol";

const NUMBER_LITERAL = "[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?";
const NUMBER_PATTERN = new RegExp(`^${NUMBER_LITERAL}$`, "i");
const WAVES: readonly AudioWave[] = ["square", "sine", "triangle", "sawtooth"];

export interface ImportedSound {
  notes: number[];
  step?: number;
  volume?: number;
  wave?: AudioWave;
}

function stripLineComments(source: string): string {
  return source.replace(/\/\/.*$/gm, "").trim();
}

function parseNumberList(source: string): number[] | null {
  const tokens = source.split(",").map((token) => token.trim());
  if (tokens.at(-1) === "") tokens.pop();
  if (tokens.length === 0 || tokens.some((token) => !NUMBER_PATTERN.test(token))) return null;

  const values = tokens.map(Number);
  return values.every(Number.isFinite) ? values : null;
}

export function parseSpriteCode(source: string): number[] {
  const match = stripLineComments(source).match(
    /^(?:const\s+spritePixels\s*=\s*)?\[([\s\S]*?)\]\s*(?:as\s+const)?\s*;?$/,
  );
  const pixels = match ? parseNumberList(match[1]) : null;

  if (!pixels) throw new Error("Paste generated sprite code or a 64-value sprite array.");
  if (pixels.length !== 64) throw new Error("Sprite code must contain exactly 64 pixels.");
  if (pixels.some((pixel) => !Number.isInteger(pixel) || pixel < 0 || pixel > 3)) {
    throw new Error("Sprite pixels must be integers from 0 to 3.");
  }

  return pixels;
}

export function parseSoundCode(source: string): ImportedSound {
  const normalized = stripLineComments(source);
  const match = normalized.match(
    new RegExp(
      `^(?:const\\s+sound\\s*=\\s*)?\\[([\\s\\S]*?)\\]\\s*(?:as\\s+const)?\\s*;?\\s*(?:sfx\\s*\\(\\s*sound\\s*,\\s*(${NUMBER_LITERAL})\\s*,\\s*(${NUMBER_LITERAL})\\s*,\\s*["'](square|sine|triangle|sawtooth)["']\\s*\\)\\s*;?)?$`,
      "i",
    ),
  );
  if (!match) throw new Error("Paste generated sound code or a 16-value sound array.");
  const notes = parseNumberList(match[1]);
  if (!notes) throw new Error("Paste generated sound code or a 16-value sound array.");
  if (notes.length !== 16) throw new Error("Sound code must contain exactly 16 steps.");
  if (notes.some((frequency) => frequency < 0)) {
    throw new Error("Sound frequencies cannot be negative.");
  }

  if (!match[2]) return { notes };

  const step = Number(match[2]);
  const volume = Number(match[3]);
  const wave = match[4].toLowerCase() as AudioWave;
  if (!Number.isInteger(step) || step < 40 || step > 300 || step % 10 !== 0) {
    throw new Error("Step duration must be from 40 to 300 ms in 10 ms increments.");
  }
  if (volume < 0.05 || volume > 0.5) {
    throw new Error("Volume must be from 0.05 to 0.5.");
  }
  if (!WAVES.includes(wave)) throw new Error("The sound waveform is not supported.");

  return { notes, step, volume, wave };
}
