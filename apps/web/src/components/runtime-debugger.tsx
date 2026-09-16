import { useState, useSyncExternalStore } from "react";
import type { InputName } from "@tynt/core";
import { ChevronRight2, Debug, Download, Pause, Play, Refresh } from "pixelarticons/react";
import { Button } from "@/components/ui/button";
import type { RuntimeDebugStore } from "@/runtime/debug-store";

const inputs: readonly InputName[] = ["left", "right", "up", "down", "a", "b"];

interface RuntimeDebuggerProps {
  active: boolean;
  paused: boolean;
  store: RuntimeDebugStore;
  onPause(): void;
  onResume(): void;
  onStep(): void;
  onRestart(): void;
  onScreenshot(): void;
}

export function RuntimeDebugger({
  active,
  paused,
  store,
  onPause,
  onResume,
  onStep,
  onRestart,
  onScreenshot,
}: RuntimeDebuggerProps) {
  const [open, setOpen] = useState(false);
  const { frame, held, pressed } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return (
    <div className="runtime-debugger mt-[12px] w-full border border-border bg-background text-[10px]">
      <Button
        className="min-h-[34px] w-full justify-start border-l-0 px-[10px] text-[10px] uppercase"
        aria-label={open ? "Close debugger" : "Open debugger"}
        aria-expanded={open}
        aria-controls="runtime-debugger-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <Debug width={16} height={16} aria-hidden="true" />
        {open ? "Close debugger" : "Open debugger"}
        <span className="ml-auto text-muted-foreground">frame {frame}</span>
      </Button>
      {open ? (
        <section
          className="grid border-t border-border"
          id="runtime-debugger-panel"
          role="region"
          aria-label="Runtime debugger"
        >
          <div className="flex items-center justify-between gap-[12px] px-[10px] py-[8px]">
            <span>{paused ? "paused" : active ? "running" : "stopped"}</span>
            <span className="text-muted-foreground">frame {frame}</span>
          </div>
          <div className="grid grid-cols-6 border-t border-border" aria-label="Input state">
            {inputs.map((input) => (
              <span
                className="grid min-h-[30px] place-items-center border-r border-border uppercase last:border-r-0 data-[held=true]:bg-foreground data-[held=true]:text-background data-[pressed=true]:outline data-[pressed=true]:outline-2 data-[pressed=true]:outline-offset-[-3px] data-[pressed=true]:outline-background"
                data-held={held.includes(input)}
                data-pressed={pressed.includes(input)}
                key={input}
              >
                {input}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-4 border-t border-border max-[430px]:grid-cols-2 [&>button]:min-h-[36px] [&>button]:border-l [&>button]:px-[6px] [&>button]:text-[9px] [&>button:first-child]:border-l-0 max-[430px]:[&>button:nth-child(3)]:border-t max-[430px]:[&>button:nth-child(3)]:border-l-0 max-[430px]:[&>button:nth-child(4)]:border-t">
            <Button disabled={!active} onClick={paused ? onResume : onPause}>
              {paused ? (
                <Play width={15} height={15} aria-hidden="true" />
              ) : (
                <Pause width={15} height={15} aria-hidden="true" />
              )}
              {paused ? "Resume" : "Pause"}
            </Button>
            <Button disabled={!active || !paused} onClick={onStep}>
              <ChevronRight2 width={15} height={15} aria-hidden="true" />
              Step frame
            </Button>
            <Button disabled={!active} onClick={onRestart}>
              <Refresh width={15} height={15} aria-hidden="true" />
              Restart
            </Button>
            <Button onClick={onScreenshot}>
              <Download width={15} height={15} aria-hidden="true" />
              Screenshot
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
