import { useMemo, useState } from "react";
import { play } from "cuelume";
import { Copy, Trash } from "pixelarticons/react";
import { CodeImportDialog } from "@/components/code-import-dialog";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { usePointerPaint } from "@/hooks/use-pointer-paint";
import { parseSpriteCode } from "@/lib/creative-import";

interface SpritePageProps {
  soundEnabled: boolean;
  onSoundToggle(): void;
}

function spriteCode(pixels: readonly number[]): string {
  const rows = Array.from(
    { length: 8 },
    (_, row) => `  ${pixels.slice(row * 8, row * 8 + 8).join(", ")},`,
  );
  return `const spritePixels = [\n${rows.join("\n")}\n] as const;\n\n// draw with: sprite(spritePixels, 8, 8, x, y);`;
}

export function SpritePage({ soundEnabled, onSoundToggle }: SpritePageProps) {
  const [pixels, setPixels] = useState(() => Array<number>(64).fill(0));
  const [color, setColor] = useState(3);
  const [status, setStatus] = useState("8 × 8 · color 3 selected");
  const [importOpen, setImportOpen] = useState(false);
  const [importSource, setImportSource] = useState("");
  const [importError, setImportError] = useState("");
  const code = useMemo(() => spriteCode(pixels), [pixels]);

  const paint = (index: number) => {
    setPixels((current) =>
      current.map((value, pixelIndex) => (pixelIndex === index ? color : value)),
    );
    setStatus(`pixel ${(index % 8) + 1}, ${Math.floor(index / 8) + 1} painted`);
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

  const importCode = () => {
    try {
      setPixels(parseSpriteCode(importSource));
      setStatus("sprite imported");
      setImportSource("");
      setImportError("");
      setImportOpen(false);
      play("success");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Sprite code could not be imported.");
      play("error");
    }
  };

  const pointerPaint = usePointerPaint<HTMLDivElement>({
    selector: "[data-pixel-index]",
    paint: (element) => paint(Number(element.dataset.pixelIndex)),
  });

  return (
    <div className="gallery-shell sprite-shell grid h-full w-full grid-rows-[41px_minmax(0,1fr)_25px] bg-background max-[560px]:h-dvh max-[560px]:grid-rows-[41px_minmax(0,1fr)_calc(41px+env(safe-area-inset-bottom))]">
      <SiteHeader active="sprites" />
      <main className="sprite-main overflow-auto px-[clamp(18px,5vw,72px)] pt-[42px] pb-[72px] max-[560px]:pb-[28px]">
        <header className="sprite-heading mx-auto flex w-[min(100%,960px)] items-end justify-between gap-[32px] border-b border-foreground pb-[24px] max-[700px]:grid max-[560px]:gap-[12px] max-[560px]:pb-[16px]">
          <h1 className="m-0 text-[clamp(30px,5vw,58px)] leading-[0.95] font-[580] tracking-[-0.065em]">
            Sprite editor
          </h1>
          <p className="m-0 max-w-[42ch] leading-[1.55] text-[#555555]">
            Paint an indexed 8×8 sprite, then copy it directly into a cartridge.
          </p>
        </header>
        <section className="sprite-workspace mx-auto grid w-[min(100%,960px)] grid-cols-[minmax(280px,1fr)_minmax(300px,1fr)] border-b border-l border-border max-[700px]:grid-cols-1">
          <div
            className="sprite-canvas grid aspect-square touch-none grid-cols-[repeat(8,minmax(28px,1fr))] self-start bg-foreground"
            aria-label="Eight by eight sprite canvas"
            {...pointerPaint}
          >
            {pixels.map((value, index) => (
              <button
                className={`min-w-0 cursor-crosshair border-0 border-t border-r border-[#777777] hover:outline-2 hover:-outline-offset-4 focus-visible:outline-offset-[-4px] ${value < 2 ? "hover:outline-background" : "hover:outline-foreground"}`}
                key={index}
                type="button"
                aria-label={`Pixel ${(index % 8) + 1}, ${Math.floor(index / 8) + 1} color ${value}`}
                data-pixel-index={index}
                style={{ background: ["#000", "#555", "#aaa", "#fff"][value] }}
                onClick={(event) => {
                  if (event.detail === 0) paint(index);
                }}
                data-cuelume-hover="tick"
                data-cuelume-press=""
                data-cuelume-release=""
              />
            ))}
          </div>
          <aside className="sprite-controls grid min-h-0 grid-rows-[64px_minmax(0,1fr)_41px_32px] border-r border-border">
            <div className="sprite-palette grid h-[64px] grid-cols-4" aria-label="Sprite palette">
              {[0, 1, 2, 3].map((value) => (
                <button
                  className={`cursor-pointer border-0 border-t border-r border-border hover:outline-2 hover:-outline-offset-4 aria-pressed:outline-3 aria-pressed:-outline-offset-6 aria-pressed:outline-foreground first:aria-pressed:outline-background ${value < 2 ? "hover:outline-background" : "hover:outline-foreground"}`}
                  key={value}
                  type="button"
                  aria-label={`Color ${value}`}
                  aria-pressed={color === value}
                  style={{ background: ["#000", "#555", "#aaa", "#fff"][value] }}
                  onClick={() => {
                    setColor(value);
                    setStatus(`8 × 8 · color ${value} selected`);
                  }}
                  data-cuelume-hover="tick"
                  data-cuelume-toggle=""
                />
              ))}
            </div>
            <textarea
              className="min-h-0 w-full resize-none border-0 border-t border-border bg-muted p-[16px] font-[inherit] leading-normal max-[560px]:min-h-[190px]"
              aria-label="Sprite code"
              readOnly
              value={code}
            />
            <div className="sprite-actions grid grid-cols-3">
              <CodeImportDialog
                description="Paste code copied from this editor, or an array of exactly 64 color values from 0 to 3. Code is parsed, never executed."
                error={importError}
                importLabel="Import sprite"
                inputLabel="Sprite code to import"
                open={importOpen}
                title="Import sprite code"
                triggerClassName="min-h-[41px] justify-center"
                triggerLabel="Import"
                value={importSource}
                onImport={importCode}
                onOpenChange={(open) => {
                  setImportOpen(open);
                  if (!open) {
                    setImportSource("");
                    setImportError("");
                  }
                }}
                onValueChange={(value) => {
                  setImportSource(value);
                  setImportError("");
                }}
              />
              <Button
                className="min-h-[41px] justify-center"
                aria-label="Copy sprite code"
                onClick={() => {
                  void copy();
                }}
              >
                <Copy width={24} height={24} aria-hidden="true" />
                Copy code
              </Button>
              <Button
                className="min-h-[41px] justify-center"
                aria-label="Clear sprite"
                onClick={() => {
                  setPixels(Array(64).fill(0));
                  setStatus("cleared");
                }}
              >
                <Trash width={24} height={24} aria-hidden="true" />
                Clear
              </Button>
            </div>
            <p
              className="sprite-status m-0 min-h-[32px] border-t border-border px-[12px] py-[8px] text-[#555555]"
              role="status"
              aria-live="polite"
            >
              {status}
            </p>
          </aside>
        </section>
      </main>
      <SiteFooter
        summary="four indexed colors"
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
      />
    </div>
  );
}
