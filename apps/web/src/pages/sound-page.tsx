import { useEffect, useMemo, useRef, useState } from "react";
import { play } from "cuelume";
import { Copy, Music, Play, Stop, Trash } from "pixelarticons/react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { usePointerPaint } from "@/hooks/use-pointer-paint";
import { CartridgeAudioEngine } from "@/runtime/audio";
import type { AudioWave, CartridgeAudio } from "@/runtime/protocol";
import { SOUND_NOTES, soundCode } from "@/sound-editor";

const STEP_COUNT = 16;
const WAVES: readonly AudioWave[] = ["square", "sine", "triangle", "sawtooth"];
const STARTER_SOUND = [
  523.25, 0, 659.25, 0, 783.99, 0, 1046.5, 0, 783.99, 0, 659.25, 0, 523.25, 0,
  0, 0,
] as const;

interface SoundPageProps {
  soundEnabled: boolean;
  onSoundToggle(): void;
  playAudio?(command: CartridgeAudio): void | Promise<void>;
  stopAudio?(): void;
}

export function SoundPage({
  soundEnabled,
  onSoundToggle,
  playAudio,
  stopAudio,
}: SoundPageProps) {
  const [notes, setNotes] = useState<number[]>(() => [...STARTER_SOUND]);
  const [step, setStep] = useState(80);
  const [volume, setVolume] = useState(0.15);
  const [wave, setWave] = useState<AudioWave>("square");
  const [status, setStatus] = useState("16 steps · starter chime loaded");
  const engineRef = useRef<CartridgeAudioEngine | null>(null);
  const code = useMemo(
    () => soundCode(notes, step, volume, wave),
    [notes, step, volume, wave],
  );

  const stop = () => {
    stopAudio?.();
    engineRef.current?.stop();
  };

  useEffect(
    () => () => {
      stopAudio?.();
      engineRef.current?.stop();
    },
    [stopAudio],
  );

  useEffect(() => {
    if (!soundEnabled) stop();
  }, [soundEnabled, stopAudio]);

  const setNote = (index: number, frequency: number, name: string) => {
    setNotes((current) =>
      current.map((value, stepIndex) =>
        stepIndex === index ? (value === frequency ? 0 : frequency) : value,
      ),
    );
    setStatus(
      `step ${index + 1} · ${notes[index] === frequency ? "rest" : name}`,
    );
  };

  const preview = () => {
    stop();
    if (!soundEnabled) {
      setStatus("sound is off");
      return;
    }
    const emit =
      playAudio ??
      ((command: CartridgeAudio) => {
        engineRef.current ??= new CartridgeAudioEngine();
        return engineRef.current.play(command);
      });
    notes.forEach((frequency, index) => {
      if (frequency <= 0) return;
      void emit({
        frequency,
        duration: Math.max(1, step - 10),
        volume,
        wave,
        delay: index * step,
      });
    });
    const noteCount = notes.filter((frequency) => frequency > 0).length;
    setStatus(
      noteCount === 0
        ? "add a note first"
        : `playing ${noteCount} ${noteCount === 1 ? "note" : "notes"}`,
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
      play("success");
    } catch {
      setStatus("copy failed");
      play("error");
    }
  };

  const pointerPaint = usePointerPaint<HTMLDivElement>({
    selector: "[data-sound-cell]",
    paint: (element) =>
      setNote(
        Number(element.dataset.stepIndex),
        Number(element.dataset.noteFrequency),
        element.dataset.noteName ?? "note",
      ),
  });

  return (
    <div className="gallery-shell sound-shell grid h-full w-full grid-rows-[41px_minmax(0,1fr)_25px] bg-background max-[560px]:h-dvh max-[560px]:grid-rows-[41px_minmax(0,1fr)_calc(41px+env(safe-area-inset-bottom))]">
      <SiteHeader active="sounds" />
      <main className="sound-main overflow-auto px-[clamp(18px,5vw,72px)] pt-[42px] pb-[72px] max-[560px]:pb-[28px]">
        <header className="mx-auto flex w-[min(100%,1120px)] items-end justify-between gap-[32px] border-b border-foreground pb-[24px] max-[700px]:grid max-[560px]:gap-[12px] max-[560px]:pb-[16px]">
          <h1 className="m-0 text-[clamp(30px,5vw,58px)] leading-[0.95] font-[580] tracking-[-0.065em]">
            Sound editor
          </h1>
          <p className="m-0 max-w-[46ch] leading-[1.55] text-[#555555]">
            Compose a sixteen-step effect, preview it, then copy it directly
            into a cartridge.
          </p>
        </header>

        <section className="mx-auto grid h-[min(680px,calc(100dvh-220px))] min-h-[480px] w-[min(100%,1120px)] grid-cols-[minmax(0,1fr)_320px] border-b border-l border-border max-[820px]:h-auto max-[820px]:min-h-0 max-[820px]:grid-cols-1">
          <div
            className="min-h-0 min-w-0 overflow-auto border-r border-b md:border-b-0 border-border bg-background max-[820px]:max-h-[440px]"
            aria-label="Sound sequence"
          >
            <div
              className="grid min-w-[610px] grid-cols-[58px_repeat(16,minmax(34px,1fr))]"
              {...pointerPaint}
            >
              <span
                className="sticky left-0 z-20 border-r border-border bg-muted"
                aria-hidden="true"
              />
              {notes.map((_, index) => (
                <span
                  className={`border-border bg-muted py-[8px] text-center text-[10px] text-muted-foreground ${index === notes.length - 1 ? "border-r-0" : "border-r"}`}
                  key={index}
                >
                  {index + 1}
                </span>
              ))}
              {SOUND_NOTES.map((note) => (
                <div className="contents" key={note.name}>
                  <span
                    className={`sticky left-0 z-10 border-t border-r border-border px-[8px] py-[5px] ${note.accidental ? "bg-foreground text-background" : "bg-background"}`}
                  >
                    {note.name}
                  </span>
                  {notes.map((selected, index) => (
                    <button
                      className={`min-h-[30px] touch-none cursor-crosshair border-0 border-t border-border outline-none hover:bg-[#aaaaaa] focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-foreground ${index === notes.length - 1 ? "border-r-0" : "border-r"} ${selected === note.frequency ? "bg-foreground hover:bg-[#555555]" : note.accidental ? "bg-muted" : "bg-background"}`}
                      key={index}
                      type="button"
                      aria-label={`Step ${index + 1} ${note.name}`}
                      aria-pressed={selected === note.frequency}
                      data-sound-cell=""
                      data-step-index={index}
                      data-note-frequency={note.frequency}
                      data-note-name={note.name}
                      onClick={(event) => {
                        if (event.detail === 0)
                          setNote(index, note.frequency, note.name);
                      }}
                      data-cuelume-hover="tick"
                      data-cuelume-toggle=""
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <aside className="grid min-h-0 grid-rows-[auto_auto_minmax(170px,1fr)_auto_32px] border-r border-border">
            <div className="p-[14px]">
              <span className="mb-[8px] block text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                Waveform
              </span>
              <div className="grid grid-cols-2 border-t border-border">
                {WAVES.map((value) => (
                  <Button
                    className="min-h-[36px] border-r border-b border-l-0 px-[8px]"
                    variant={wave === value ? "active" : "default"}
                    aria-pressed={wave === value}
                    key={value}
                    onClick={() => {
                      setWave(value);
                      setStatus(`${value} wave selected`);
                    }}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-[14px] border-t border-border p-[14px]">
              <label className="grid grid-cols-[1fr_auto] gap-[8px]">
                Step duration <output>{step} ms</output>
                <input
                  className="col-span-2 w-full accent-black"
                  aria-label="Step duration"
                  type="range"
                  min="40"
                  max="300"
                  step="10"
                  value={step}
                  onChange={(event) => setStep(Number(event.target.value))}
                  data-cuelume-hover="tick"
                  data-cuelume-toggle=""
                />
              </label>
              <label className="grid grid-cols-[1fr_auto] gap-[8px]">
                Volume <output>{Math.round(volume * 100)}%</output>
                <input
                  className="col-span-2 w-full accent-black"
                  aria-label="Volume"
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  data-cuelume-hover="tick"
                  data-cuelume-toggle=""
                />
              </label>
            </div>
            <textarea
              className="min-h-0 w-full resize-none border-0 border-t border-border bg-muted p-[16px] font-[inherit] leading-normal max-[820px]:min-h-[170px]"
              aria-label="Sound code"
              readOnly
              value={code}
            />
            <div className="grid grid-cols-2 border-t border-border">
              <Button
                className="min-h-[41px] justify-center border-l-0"
                aria-label="Play sound"
                onClick={preview}
              >
                <Play width={24} height={24} aria-hidden="true" />
                Play
              </Button>
              <Button
                className="min-h-[41px] justify-center"
                aria-label="Stop sound"
                onClick={() => {
                  stop();
                  setStatus("stopped");
                }}
              >
                <Stop width={24} height={24} aria-hidden="true" />
                Stop
              </Button>
              <Button
                className="min-h-[41px] justify-center border-t border-l-0"
                aria-label="Copy sound code"
                onClick={() => {
                  void copy();
                }}
              >
                <Copy width={24} height={24} aria-hidden="true" />
                Copy code
              </Button>
              <Button
                className="min-h-[41px] justify-center border-t"
                aria-label="Clear sound"
                onClick={() => {
                  stop();
                  setNotes(Array(STEP_COUNT).fill(0));
                  setStatus("cleared");
                }}
              >
                <Trash width={24} height={24} aria-hidden="true" />
                Clear
              </Button>
            </div>
            <p
              className="m-0 min-h-[32px] border-t border-border px-[12px] py-[8px] text-[#555555]"
              role="status"
              aria-live="polite"
            >
              <Music
                className="mr-[6px] inline size-[14px]"
                aria-hidden="true"
              />
              {status}
            </p>
          </aside>
        </section>
      </main>
      <SiteFooter
        summary="sixteen-step sound effects"
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
      />
    </div>
  );
}
