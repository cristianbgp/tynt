import { useEffect, useRef, useState } from "react";
import type { Draft } from "@tynt/core";
import { play } from "cuelume";
import { Expand, Pause, Play, Refresh } from "pixelarticons/react";
import { Link } from "react-router";
import { TyntMark } from "@/components/brand";
import { ErrorConsole } from "@/components/error-console";
import { Preview } from "@/components/preview";
import { SiteHeader } from "@/components/site-chrome";
import { FooterActions } from "@/components/status-bar";
import { Button } from "@/components/ui/button";
import { useRuntime } from "@/hooks/use-runtime";

interface PlayPageProps {
  cartridge: Draft;
  editorHref: string;
  soundEnabled: boolean;
  onSoundToggle(): void;
}

const soundLinkProps = {
  "data-cuelume-hover": "tick",
  "data-cuelume-press": "",
  "data-cuelume-release": "",
} as const;
const playButtonClassName = "max-[900px]:w-full max-[900px]:min-w-0 max-[900px]:px-[8px]";

export function CartridgeNotFound({ local = false }: { local?: boolean }) {
  return (
    <div className="grid min-h-full grid-rows-[41px_minmax(0,1fr)]">
      <SiteHeader />
      <main className="not-found-page grid place-content-center justify-items-start gap-[12px] [&_h1]:m-0 [&_p]:m-0">
        <span className="state-mark inline-grid size-[42px] place-items-center bg-foreground [&_.brand-mark]:size-[24px]">
          <TyntMark />
        </span>
        <span>404</span>
        <h1>Cartridge not found</h1>
        <p>
          {local
            ? "It may have been removed from this device."
            : "This public cartridge is not in the gallery."}
        </p>
        <Link
          className="border-b border-current px-[2px] pb-[2px] hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
          to={local ? "/library" : "/gallery"}
          {...soundLinkProps}
        >
          {local ? "Open library" : "Open gallery"}
        </Link>
      </main>
    </div>
  );
}

export function PlayPage({ cartridge, editorHref, soundEnabled, onSoundToggle }: PlayPageProps) {
  const [paused, setPaused] = useState(false);
  const [pageError, setPageError] = useState("");
  const stageRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const runtime = useRuntime(soundEnabled);
  const runRuntime = runtime.run;

  useEffect(() => {
    void runRuntime(cartridge.source).then((started) => {
      if (started) previewRef.current?.focus();
    });
  }, [cartridge.source, runRuntime]);
  useEffect(() => {
    if (pageError || runtime.error) play("error");
  }, [pageError, runtime.error]);

  const run = async () => {
    const started = await runtime.run(cartridge.source);
    if (started) previewRef.current?.focus();
  };
  const togglePause = () => {
    if (paused) {
      setPaused(false);
      void run();
    } else {
      runtime.stop();
      runtime.resetInput();
      setPaused(true);
    }
  };
  const restart = () => {
    runtime.stop();
    setPaused(false);
    void run();
  };
  const enterFullscreen = async () => {
    try {
      if (!stageRef.current?.requestFullscreen)
        throw new Error("Fullscreen is not available in this browser");
      await stageRef.current.requestFullscreen();
      previewRef.current?.focus();
      setPageError("");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div className="play-shell grid h-full w-full grid-rows-[41px_41px_minmax(0,1fr)_auto_25px] max-[900px]:h-auto max-[900px]:min-h-full max-[900px]:grid-rows-[41px_82px_minmax(0,1fr)_auto_25px] max-[560px]:h-dvh max-[560px]:min-h-0 max-[560px]:grid-rows-[41px_82px_minmax(0,1fr)_auto_calc(41px+env(safe-area-inset-bottom))]">
      <SiteHeader editorTo={editorHref} />
      <header className="play-topbar grid min-w-0 grid-cols-[minmax(140px,1fr)_max-content] border-b border-border max-[900px]:h-[82px] max-[900px]:grid-cols-1 max-[900px]:grid-rows-[41px_41px]">
        <div className="play-identity flex min-w-0 items-center gap-[12px] px-[16px]">
          <h1 className="m-0 overflow-hidden text-[13px] text-ellipsis whitespace-nowrap">
            {cartridge.title}
          </h1>
          <span className="overflow-hidden text-[10px] text-ellipsis whitespace-nowrap text-muted-foreground">
            {cartridge.author ? `by ${cartridge.author}` : "local cartridge"}
          </span>
        </div>
        <div
          className="play-actions flex max-[900px]:grid max-[900px]:grid-cols-3 max-[900px]:border-t max-[900px]:border-border"
          role="group"
          aria-label="Play controls"
        >
          <Button className={playButtonClassName} aria-label="Restart" onClick={restart}>
            <Refresh width={24} height={24} aria-hidden="true" />
            <span className="max-[560px]:hidden">Restart</span>
          </Button>
          <Button
            className={playButtonClassName}
            aria-label={paused ? "Resume" : "Pause"}
            variant={paused ? "active" : "default"}
            onClick={togglePause}
          >
            {paused ? (
              <Play width={24} height={24} aria-hidden="true" />
            ) : (
              <Pause width={24} height={24} aria-hidden="true" />
            )}
            <span className="max-[560px]:hidden">{paused ? "Resume" : "Pause"}</span>
          </Button>
          <Button
            className={playButtonClassName}
            aria-label="Enter fullscreen"
            onClick={() => {
              void enterFullscreen();
            }}
          >
            <Expand width={24} height={24} aria-hidden="true" />
            <span className="max-[560px]:hidden">Fullscreen</span>
          </Button>
        </div>
      </header>
      <main
        ref={stageRef}
        className="play-stage fullscreen:bg-muted min-h-0 min-w-0 bg-background max-[900px]:min-h-[680px] max-[560px]:min-h-0 max-[560px]:overflow-auto max-[560px]:select-none max-[560px]:[-webkit-touch-callout:none] max-[560px]:[&_.emulator-controls]:mx-[16px] max-[560px]:[&_.emulator-controls]:mt-[10px] max-[560px]:[&_.emulator-controls]:mb-[8px] max-[560px]:[&_.preview-frame]:border-0 max-[560px]:[&_.preview-frame]:outline max-[560px]:[&_.preview-frame]:-outline-offset-1 max-[560px]:[&_.preview-frame]:outline-foreground max-[560px]:[&_.preview-hints]:px-[8px] [&_.preview-pane]:h-full [&_.preview-pane]:min-h-0 [&_.preview-pane]:w-full [&_.preview-pane]:min-w-0 max-[560px]:[&_.preview-pane]:h-auto max-[560px]:[&_.preview-pane]:min-h-full max-[560px]:[&_.preview-pane]:[align-content:safe_center] max-[560px]:[&_.preview-pane]:items-start max-[560px]:[&_.preview-pane]:p-0 min-[901px]:[&_.preview-pane]:[align-content:start] max-[560px]:[&_canvas]:w-[min(320px,100vw)]"
      >
        <Preview
          interactionRef={previewRef}
          canvasRef={runtime.canvasRef}
          onKeyDown={(code) => runtime.setKey(code, true)}
          onKeyUp={(code) => runtime.setKey(code, false)}
          onInput={runtime.setInput}
          onBlur={runtime.resetInput}
          gamepadConnected={runtime.gamepadConnected}
          showError={runtime.showPreviewError}
        />
      </main>
      <ErrorConsole error={pageError || runtime.error} className="row-start-4" />
      <footer className="play-footer row-start-5 flex items-center gap-[14px] border-t border-border px-[12px] text-[11px] text-[#555555] max-[560px]:min-h-[41px] max-[560px]:pb-[env(safe-area-inset-bottom)]">
        <span role="status" aria-live="polite">
          {paused ? "paused" : runtime.status}
        </span>
        <span className="ml-auto max-[560px]:hidden">{cartridge.controls || "ARROWS · Z / X"}</span>
        <FooterActions soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} />
      </footer>
    </div>
  );
}
