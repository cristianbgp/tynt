import type { AudioWave } from "@/runtime/protocol";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export interface SoundNote {
  readonly name: string;
  readonly frequency: number;
  readonly accidental: boolean;
}

function frequency(midi: number): number {
  return Math.round(440 * 2 ** ((midi - 69) / 12) * 100) / 100;
}

export const SOUND_NOTES: readonly SoundNote[] = Array.from({ length: 37 }, (_, index) => {
  const midi = 84 - index;
  const name = `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
  return { name, frequency: frequency(midi), accidental: name.includes("#") };
});

export function frequencyForNote(name: string): number | undefined {
  return SOUND_NOTES.find((note) => note.name === name)?.frequency;
}

function numberLiteral(value: number): string {
  return Number(value.toFixed(2)).toString();
}

export function soundCode(
  notes: readonly number[],
  step: number,
  volume: number,
  wave: AudioWave,
): string {
  const values = notes.map(numberLiteral).join(", ");
  return `const sound = [${values}] as const;\n\n// play with:\nsfx(sound, ${step}, ${numberLiteral(volume)}, "${wave}");`;
}
