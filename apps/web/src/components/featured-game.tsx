import { useEffect, useRef } from "react";
import { Refresh } from "pixelarticons/react";
import type { PublicCartridge } from "@/cartridges/public-cartridges";
import { Preview } from "@/components/preview";
import { useRuntime } from "@/hooks/use-runtime";

export function FeaturedGame({
  cartridge,
  soundEnabled,
}: {
  cartridge: PublicCartridge;
  soundEnabled: boolean;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const runtime = useRuntime(soundEnabled);
  const run = runtime.run;

  useEffect(() => {
    void run(cartridge.source).then((started) => {
      if (started) previewRef.current?.focus();
    });
  }, [cartridge.source, run]);

  return (
    <div className="bg-muted">
      <div className="min-h-[360px] [&_.preview-pane]:min-h-[360px] [&_.preview-pane]:py-[18px] max-[560px]:[&_.preview-pane]:min-h-[300px]">
        <Preview
          interactionRef={previewRef}
          canvasRef={runtime.canvasRef}
          onKeyDown={(code) => runtime.setKey(code, true)}
          onKeyUp={(code) => runtime.setKey(code, false)}
          onInput={runtime.setInput}
          onBlur={runtime.resetInput}
          showError={runtime.showPreviewError}
        />
      </div>
      {runtime.error ? (
        <p
          className="m-0 border-t border-[var(--error)] bg-[var(--error-background)] p-[12px] text-[var(--error)]"
          role="alert"
        >
          {runtime.error}
        </p>
      ) : null}
      <div className="flex min-h-[40px] items-center justify-between gap-[10px] border-t border-border px-[14px] text-[11px]">
        <span role="status">{runtime.status}</span>
        <button
          type="button"
          className="inline-flex min-h-[40px] cursor-pointer items-center gap-[6px] border-l border-border px-[12px] hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
          data-cuelume-hover="tick"
          data-cuelume-press=""
          data-cuelume-release=""
          onClick={() => {
            void run(cartridge.source).then((started) => {
              if (started) previewRef.current?.focus();
            });
          }}
        >
          <Refresh width={18} height={18} aria-hidden="true" /> Restart
        </button>
      </div>
    </div>
  );
}
