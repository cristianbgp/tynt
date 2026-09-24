import type { ReactNode, Ref, RefCallback } from "react";
import type { InputName } from "@tynt/core";
import { EmulatorControls } from "@/components/emulator-controls";

interface PreviewProps {
  interactionRef: Ref<HTMLDivElement>;
  canvasRef: RefCallback<HTMLCanvasElement>;
  onKeyDown(code: string): boolean;
  onKeyUp(code: string): boolean;
  onInput(input: InputName, down: boolean): void;
  onBlur(): void;
  gamepadConnected?: boolean;
  showError?: boolean;
  debuggerPanel?: ReactNode;
}

export function Preview({
  interactionRef,
  canvasRef,
  onKeyDown,
  onKeyUp,
  onInput,
  onBlur,
  gamepadConnected = false,
  showError = false,
  debuggerPanel,
}: PreviewProps) {
  return (
    <section
      className="preview-pane [container-type:inline-size] grid min-h-0 place-content-center items-center bg-muted px-[8px] py-[24px] [container-name:preview]"
      aria-label="Game preview"
    >
      <div
        ref={interactionRef}
        className="preview-interaction w-max outline-none focus-visible:outline-none focus-visible:[&_.preview-frame]:outline-2 focus-visible:[&_.preview-frame]:outline-offset-2 focus-visible:[&_.preview-frame]:outline-foreground"
        id="preview"
        tabIndex={0}
        aria-describedby="preview-help"
        onKeyDown={(event) => {
          if (onKeyDown(event.code)) event.preventDefault();
        }}
        onKeyUp={(event) => {
          if (onKeyUp(event.code)) event.preventDefault();
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onBlur();
        }}
      >
        <div className="preview-frame relative mx-auto grid w-max place-items-center border border-foreground bg-foreground">
          <canvas
            className="block aspect-[10/9] h-auto w-[160px] [image-rendering:pixelated]"
            ref={canvasRef}
            width="160"
            height="144"
            aria-label="Game canvas"
          />
          {showError ? (
            <div
              className="preview-error absolute inset-0 grid content-center gap-[6px] border-4 border-[var(--error)] bg-[rgb(255_241_240/94%)] text-center text-[var(--error)] uppercase"
              aria-hidden="true"
            >
              <strong className="text-[15px] tracking-[0.04em]">Run error</strong>
              <span className="text-[9px] tracking-[0.08em]">Check details below</span>
            </div>
          ) : null}
        </div>
        <div
          id="preview-help"
          className="preview-hints mt-[9px] flex justify-between text-[10px] tracking-[0.06em] text-[#555555]"
        >
          <span>160 × 144</span>
          <span>ARROWS · Z / X</span>
        </div>
        <EmulatorControls onInput={onInput} gamepadConnected={gamepadConnected} />
        {debuggerPanel}
      </div>
    </section>
  );
}
