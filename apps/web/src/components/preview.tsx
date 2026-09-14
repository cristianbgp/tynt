import type { Ref, RefCallback } from "react";
import type { InputName } from "@tynt/core";
import { EmulatorControls } from "@/components/emulator-controls";

interface PreviewProps {
  interactionRef: Ref<HTMLDivElement>;
  canvasRef: RefCallback<HTMLCanvasElement>;
  onKeyDown(code: string): boolean;
  onKeyUp(code: string): boolean;
  onInput(input: InputName, down: boolean): void;
  onBlur(): void;
  showError?: boolean;
}

export function Preview({ interactionRef, canvasRef, onKeyDown, onKeyUp, onInput, onBlur, showError = false }: PreviewProps) {
  return (
    <section className="preview-pane" aria-label="Game preview">
      <div
        ref={interactionRef}
        className="preview-interaction"
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
        <div className="preview-frame">
          <canvas ref={canvasRef} width="160" height="144" aria-label="Game canvas" />
          {showError ? (
            <div className="preview-error" aria-hidden="true">
              <strong>Run error</strong>
              <span>Check details below</span>
            </div>
          ) : null}
        </div>
        <div id="preview-help" className="preview-hints">
          <span>160 × 144</span>
          <span>ARROWS · Z / X</span>
        </div>
        <EmulatorControls onInput={onInput} />
      </div>
    </section>
  );
}
