import { useEffect, useRef, useState } from "react";
import type { Draft } from "@tynt/core";
import { play } from "cuelume";
import { BookOpen, Code, Expand, Pause, Play, Refresh } from "pixelarticons/react";
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
    <div className="play-shell">
      <header className="play-topbar">
        <BrandLink />
        <div className="play-identity"><h1>{cartridge.title}</h1><span>{cartridge.author ? `by ${cartridge.author}` : "local cartridge"}</span></div>
        <nav className="play-actions" aria-label="Play controls">
          <Link aria-label="Edit cartridge" to={editorHref} {...soundLinkProps}><Code width={24} height={24} aria-hidden="true" /><span>Editor</span></Link>
          <Link aria-label="Open library" to="/library" {...soundLinkProps}><BookOpen width={24} height={24} aria-hidden="true" /><span>Library</span></Link>
          <Button aria-label="Restart" onClick={restart}><Refresh width={24} height={24} aria-hidden="true" /><span>Restart</span></Button>
          <Button aria-label={paused ? "Resume" : "Pause"} variant={paused ? "active" : "default"} onClick={togglePause}>{paused ? <Play width={24} height={24} aria-hidden="true" /> : <Pause width={24} height={24} aria-hidden="true" />}<span>{paused ? "Resume" : "Pause"}</span></Button>
          <Button aria-label="Enter fullscreen" onClick={() => { void enterFullscreen(); }}><Expand width={24} height={24} aria-hidden="true" /><span>Fullscreen</span></Button>
        </nav>
      </header>
      <main ref={stageRef} className="play-stage">
        <Preview interactionRef={previewRef} canvasRef={runtime.canvasRef} onKeyDown={(code) => runtime.setKey(code, true)} onKeyUp={(code) => runtime.setKey(code, false)} onInput={runtime.setInput} onBlur={runtime.resetInput} showError={runtime.showPreviewError} />
      </main>
      <ErrorConsole error={pageError || runtime.error} />
      <footer className="play-footer"><span role="status" aria-live="polite">{paused ? "paused" : runtime.status}</span><span>{cartridge.controls || "ARROWS · Z / X"}</span><Attribution /><SoundToggle soundEnabled={soundEnabled} onSoundToggle={onSoundToggle} /></footer>
    </div>
  );
}
