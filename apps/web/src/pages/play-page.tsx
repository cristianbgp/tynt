import { useEffect, useRef, useState } from "react";
import type { Draft } from "@tynt/core";
import { play } from "cuelume";
import { BookOpen, Code, Expand, GalleryThumbnails, Image, Pause, Play, Refresh } from "pixelarticons/react";
import { Link } from "react-router";
import { BrandLink, TyntMark } from "@/components/brand";
import { ErrorConsole } from "@/components/error-console";
import { Preview } from "@/components/preview";
import { Attribution, SoundToggle } from "@/components/status-bar";
import { Button } from "@/components/ui/button";
import { useRuntime } from "@/hooks/use-runtime";

interface PlayPageProps {
  cartridge: Draft;
  editorHref: string;
  soundEnabled: boolean;
  onSoundToggle(): void;
}

const soundLinkProps = { "data-cuelume-hover": "tick", "data-cuelume-press": "", "data-cuelume-release": "" } as const;
const playLinkClassName = "flex items-center justify-center gap-[8px] border-l border-border px-[14px] no-underline hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background max-[900px]:w-full max-[900px]:min-w-0 max-[900px]:px-[8px]";
const playButtonClassName = "max-[900px]:w-full max-[900px]:min-w-0 max-[900px]:px-2";

export function CartridgeNotFound({ local = false }: { local?: boolean }) {
  return (
    <main className="not-found-page">
      <span className="state-mark"><TyntMark /></span><span>404</span>
      <h1>Cartridge not found</h1>
      <p>{local ? "It may have been removed from this device." : "This public cartridge is not in the gallery."}</p>
      <Link to={local ? "/library" : "/gallery"} {...soundLinkProps}>{local ? "Open library" : "Open gallery"}</Link>
    </main>
  );
}

export function PlayPage({ cartridge, editorHref, soundEnabled, onSoundToggle }: PlayPageProps) {
  const [paused, setPaused] = useState(false);
  const [pageError, setPageError] = useState("");
  const stageRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const runtime = useRuntime(soundEnabled);
  const runRuntime = runtime.run;

  useEffect(() => { void runRuntime(cartridge.source).then((started) => { if (started) previewRef.current?.focus(); }); }, [cartridge.source, runRuntime]);
  useEffect(() => { if (pageError || runtime.error) play("error"); }, [pageError, runtime.error]);

  const run = async () => { const started = await runtime.run(cartridge.source); if (started) previewRef.current?.focus(); };
  const togglePause = () => {
    if (paused) { setPaused(false); void run(); }
    else { runtime.stop(); runtime.resetInput(); setPaused(true); }
  };
  const restart = () => { runtime.stop(); setPaused(false); void run(); };
  const enterFullscreen = async () => {
    try {
      if (!stageRef.current?.requestFullscreen) throw new Error("Fullscreen is not available in this browser");
      await stageRef.current.requestFullscreen(); previewRef.current?.focus(); setPageError("");
    } catch (error) { setPageError(error instanceof Error ? error.message : String(error)); }
  };

  return (
    <div className="play-shell grid h-full w-full grid-rows-[41px_minmax(0,1fr)_auto_25px] max-[900px]:h-auto max-[900px]:min-h-full max-[900px]:grid-rows-[auto_minmax(0,1fr)_auto_25px] max-[560px]:h-dvh max-[560px]:min-h-0 max-[560px]:grid-rows-[auto_minmax(0,1fr)_auto_calc(41px+env(safe-area-inset-bottom))]">
      <header className="play-topbar grid min-w-0 grid-cols-[max-content_minmax(140px,1fr)_max-content] border-b border-border max-[900px]:grid-cols-[max-content_minmax(0,1fr)]">
        <BrandLink />
        <div className="play-identity flex min-w-0 items-baseline gap-[12px] px-[16px]">
          <h1 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px]">{cartridge.title}</h1>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-muted-foreground max-[560px]:hidden">{cartridge.author ? `by ${cartridge.author}` : "local cartridge"}</span>
        </div>
        <div className="play-actions flex max-[900px]:col-span-full max-[900px]:grid max-[900px]:grid-cols-7 max-[900px]:border-t max-[900px]:border-border">
          <nav className="play-navigation flex max-[900px]:contents" aria-label="Primary navigation">
            <Link className={playLinkClassName} aria-label="Edit cartridge" to={editorHref} {...soundLinkProps}><Code width={24} height={24} aria-hidden="true" /><span className="max-[560px]:hidden">Editor</span></Link>
            <Link className={playLinkClassName} aria-label="Open gallery" to="/gallery" {...soundLinkProps}><GalleryThumbnails width={24} height={24} aria-hidden="true" /><span className="max-[560px]:hidden">Gallery</span></Link>
            <Link className={playLinkClassName} aria-label="Open library" to="/library" {...soundLinkProps}><BookOpen width={24} height={24} aria-hidden="true" /><span className="max-[560px]:hidden">Library</span></Link>
            <Link className={playLinkClassName} aria-label="Open sprites" to="/sprites" {...soundLinkProps}><Image width={24} height={24} aria-hidden="true" /><span className="max-[560px]:hidden">Sprites</span></Link>
          </nav>
          <div className="play-controls flex max-[900px]:contents" role="group" aria-label="Play controls">
            <Button className={playButtonClassName} aria-label="Restart" onClick={restart}><Refresh width={24} height={24} aria-hidden="true" /><span className="max-[560px]:hidden">Restart</span></Button>
            <Button className={playButtonClassName} aria-label={paused ? "Resume" : "Pause"} variant={paused ? "active" : "default"} onClick={togglePause}>{paused ? <Play width={24} height={24} aria-hidden="true" /> : <Pause width={24} height={24} aria-hidden="true" />}<span className="max-[560px]:hidden">{paused ? "Resume" : "Pause"}</span></Button>
            <Button className={playButtonClassName} aria-label="Enter fullscreen" onClick={() => { void enterFullscreen(); }}><Expand width={24} height={24} aria-hidden="true" /><span className="max-[560px]:hidden">Fullscreen</span></Button>
          </div>
        </div>
      </header>
      <main ref={stageRef} className="play-stage min-h-0 min-w-0 bg-background fullscreen:bg-muted max-[900px]:min-h-[680px] max-[560px]:min-h-0 max-[560px]:overflow-auto">
        <Preview interactionRef={previewRef} canvasRef={runtime.canvasRef} onKeyDown={(code) => runtime.setKey(code, true)} onKeyUp={(code) => runtime.setKey(code, false)} onInput={runtime.setInput} onBlur={runtime.resetInput} showError={runtime.showPreviewError} />
      </main>
      <ErrorConsole error={pageError || runtime.error} />
      <footer className="play-footer flex items-center gap-[14px] border-t border-border px-[12px] text-[11px] text-[#555555] max-[560px]:min-h-[41px] max-[560px]:pb-[env(safe-area-inset-bottom)]"><span role="status" aria-live="polite">{paused ? "paused" : runtime.status}</span><span className="ml-auto max-[560px]:hidden">{cartridge.controls || "ARROWS · Z / X"}</span><Attribution /><SoundToggle soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} /></footer>
    </div>
  );
}
