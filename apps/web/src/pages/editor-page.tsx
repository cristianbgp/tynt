import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { parseCartridge, safeFilename, serializeCartridge, type Draft } from "@tynt/core";
import { play } from "cuelume";
import { useNavigate, useSearchParams } from "react-router";
import { CartridgeDetailsDialog } from "@/components/cartridge-details-dialog";
import { createAutosaver, readAutosave } from "@/autosave";
import { Editor } from "@/components/editor";
import { ErrorConsole } from "@/components/error-console";
import { Preview } from "@/components/preview";
import { MobilePaneSwitch, type MobilePane } from "@/components/mobile-pane-switch";
import { NewCartridgeDialog } from "@/components/new-cartridge-dialog";
import { StatusBar } from "@/components/status-bar";
import { Toolbar } from "@/components/toolbar";
import { SiteHeader } from "@/components/site-chrome";
import { RuntimeDebugger } from "@/components/runtime-debugger";
import { useAppShortcuts } from "@/hooks/use-app-shortcuts";
import { useRuntime } from "@/hooks/use-runtime";
import type { CartridgeLibrary } from "@/library/cartridge-library";
import { captureThumbnail } from "@/library/thumbnail";
import { downloadCanvasPng } from "@/lib/canvas-download";
import {
  copyPublicDraft,
  findPublicCartridge,
  listPublicCartridges,
} from "@/cartridges/public-cartridges";
import type { CartridgeTemplate } from "@/cartridges/templates";

function copyDraft(value: Draft): Draft {
  return {
    title: value.title,
    source: value.source,
    ...(value.author ? { author: value.author } : {}),
    ...(value.description ? { description: value.description } : {}),
    ...(value.controls ? { controls: value.controls } : {}),
  };
}

function initialDraft(publicSlug: string | null): Draft {
  const selected = publicSlug ? findPublicCartridge(publicSlug) : undefined;
  if (selected) return copyPublicDraft(selected);
  const saved = readAutosave(window.localStorage);
  return saved ?? copyPublicDraft(findPublicCartridge("starter") ?? listPublicCartridges()[0]!);
}

interface EditorPageProps {
  library: CartridgeLibrary;
  soundEnabled: boolean;
  onSoundToggle(): void;
}

export function EditorPage({ library, soundEnabled, onSoundToggle }: EditorPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedPublicSlug = searchParams.get("cartridge");
  const selectedLocalId = searchParams.get("local");
  const [draft, setDraft] = useState(() => initialDraft(selectedPublicSlug));
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [newCartridgeOpen, setNewCartridgeOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("code");
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [draftStatus, setDraftStatus] = useState("autosave on");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const scheduledDraft = useRef(JSON.stringify(draft));
  const runtime = useRuntime(soundEnabled);
  const reportRuntimeError = runtime.reportError;
  const runtimeCanvasRef = runtime.canvasRef;
  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasElementRef.current = canvas;
      runtimeCanvasRef(canvas);
    },
    [runtimeCanvasRef],
  );

  const autosaver = useMemo(
    () =>
      createAutosaver(
        window.localStorage,
        250,
        () => setDraftStatus("save failed"),
        () => setDraftStatus((current) => (current === "saved to library" ? current : "saved")),
      ),
    [],
  );

  useEffect(() => {
    const serialized = JSON.stringify(draft);
    if (scheduledDraft.current === serialized) return;
    scheduledDraft.current = serialized;
    setDraftStatus("saving…");
    autosaver.schedule(draft);
  }, [autosaver, draft]);

  useEffect(() => () => autosaver.cancel(), [autosaver]);

  useEffect(() => {
    if (!selectedPublicSlug) return;
    const next = new URLSearchParams(searchParams);
    next.delete("cartridge");
    setSearchParams(next, { replace: true });
  }, [searchParams, selectedPublicSlug, setSearchParams]);

  useEffect(() => {
    if (!selectedLocalId) return;
    let active = true;
    void library
      .get(selectedLocalId)
      .then((record) => {
        if (!active) return;
        if (!record) throw new Error("Saved cartridge not found");
        const nextDraft: Draft = {
          title: record.title,
          source: record.source,
          ...(record.author ? { author: record.author } : {}),
          ...(record.description ? { description: record.description } : {}),
          ...(record.controls ? { controls: record.controls } : {}),
        };
        draftRef.current = nextDraft;
        setDraft(nextDraft);
        setLibraryId(record.id);
        setDraftStatus("saved to library");
        const next = new URLSearchParams(searchParams);
        next.delete("local");
        setSearchParams(next, { replace: true });
      })
      .catch((error) => {
        if (!active) return;
        reportRuntimeError(error);
      });
    return () => {
      active = false;
    };
  }, [library, reportRuntimeError, searchParams, selectedLocalId, setSearchParams]);

  useEffect(() => {
    if (runtime.error) play("error");
  }, [runtime.error]);

  useEffect(() => {
    if (mobilePane === "play") previewRef.current?.focus();
  }, [mobilePane]);

  const loadExample = (id: string) => {
    const example = findPublicCartridge(id);
    if (!example) return;
    const nextDraft = copyPublicDraft(example);
    draftRef.current = nextDraft;
    runtime.stop();
    setLibraryId(null);
    setDraft(nextDraft);
    runtime.clearError();
  };

  const startTemplate = (template: CartridgeTemplate) => {
    const nextDraft = copyDraft(template.draft);
    draftRef.current = nextDraft;
    runtime.stop();
    setLibraryId(null);
    setDraft(nextDraft);
    setDraftStatus("new draft");
    setMobilePane("code");
    runtime.clearError();
    setNewCartridgeOpen(false);
    play("success");
  };

  const importCartridge = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
      const cartridge = parseCartridge(text);
      const imported = copyDraft(cartridge);
      draftRef.current = imported;
      setLibraryId(null);
      setDraft(imported);
      runtime.clearError();
      runtime.announce("imported");
      play("success");
    } catch (error) {
      runtime.reportError(error);
    }
  };

  const exportCartridge = () => {
    try {
      const current = draftRef.current;
      const blob = new Blob([serializeCartridge(current)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = safeFilename(current.title);
      anchor.click();
      URL.revokeObjectURL(url);
      runtime.clearError();
      runtime.announce("exported");
      play("success");
    } catch (error) {
      runtime.reportError(error);
    }
  };

  const run = async () => {
    if (runtime.isCompiling) return;
    if (await runtime.run(draftRef.current.source)) {
      setMobilePane("play");
      if (mobilePane === "play") previewRef.current?.focus();
    }
  };

  const saveToLibrary = async () => {
    try {
      setDraftStatus("saving to library…");
      const record = await library.save({
        id: libraryId ?? undefined,
        draft: draftRef.current,
        thumbnail: captureThumbnail(canvasElementRef.current),
      });
      setLibraryId(record.id);
      setDraftStatus("saved to library");
      runtime.clearError();
      play("success");
      return record;
    } catch (error) {
      setDraftStatus("library save failed");
      runtime.reportError(error);
      return undefined;
    }
  };

  const openPlayMode = async () => {
    const record = await saveToLibrary();
    if (record) navigate(`/play/local/${record.id}`);
  };

  const runOrStop = () => {
    if (runtime.isRunning) runtime.stop();
    else void run();
  };

  const rerun = () => {
    void run();
  };

  const openImport = () => fileInputRef.current?.click();

  const downloadScreenshot = () => {
    const canvas = canvasElementRef.current;
    if (!canvas) return;
    void downloadCanvasPng(canvas, safeFilename(draftRef.current.title))
      .then(() => play("success"))
      .catch(reportRuntimeError);
  };

  useAppShortcuts({
    onRun: rerun,
    onImport: openImport,
    onExport: exportCartridge,
    runDisabled: runtime.isCompiling,
  });

  return (
    <div
      className="app-shell grid h-full w-full grid-cols-[minmax(0,1fr)] grid-rows-[41px_41px_minmax(0,1fr)_auto_25px] max-[760px]:h-auto max-[760px]:min-h-full max-[760px]:grid-rows-[41px_82px_minmax(0,1fr)_auto_25px] max-[560px]:h-dvh max-[560px]:min-h-0 max-[560px]:grid-rows-[41px_82px_41px_minmax(0,1fr)_auto_calc(41px+env(safe-area-inset-bottom))]"
      data-runtime-state={runtime.status}
    >
      <SiteHeader active="editor" />
      <Toolbar
        filename={safeFilename(draft.title)}
        examples={listPublicCartridges()
          .filter(({ author }) => author === "tynt")
          .map(({ slug, filename }) => ({ id: slug, filename }))}
        running={runtime.isRunning}
        compiling={runtime.isCompiling}
        fileInputRef={fileInputRef}
        onNew={() => setNewCartridgeOpen(true)}
        onExampleChange={loadExample}
        onRun={runOrStop}
        onSave={() => {
          void saveToLibrary();
        }}
        onPlay={() => {
          void openPlayMode();
        }}
        onDetails={() => setDetailsOpen(true)}
        onImport={openImport}
        onExport={exportCartridge}
        onFileChange={importCartridge}
      />
      <MobilePaneSwitch value={mobilePane} onChange={setMobilePane} />
      <main
        className="workspace grid min-h-0 grid-cols-[minmax(0,13fr)_minmax(340px,7fr)] max-[760px]:grid-cols-1 max-[760px]:grid-rows-[minmax(360px,55vh)_auto] max-[560px]:h-full max-[560px]:grid-rows-[minmax(0,1fr)]"
        data-mobile-pane={mobilePane}
      >
        <Editor
          source={draft.source}
          onChange={(source) => setDraft((current) => ({ ...current, source }))}
        />
        <Preview
          interactionRef={previewRef}
          canvasRef={canvasRef}
          onKeyDown={(code) => runtime.setKey(code, true)}
          onKeyUp={(code) => runtime.setKey(code, false)}
          onInput={runtime.setInput}
          onBlur={runtime.resetInput}
          showError={runtime.showPreviewError}
          debuggerPanel={
            <RuntimeDebugger
              active={runtime.isRunning}
              paused={runtime.isPaused}
              store={runtime.debugStore}
              onPause={runtime.pause}
              onResume={runtime.resume}
              onStep={runtime.step}
              onRestart={rerun}
              onScreenshot={downloadScreenshot}
            />
          }
        />
      </main>
      <ErrorConsole error={runtime.error} className="row-start-4 max-[560px]:row-start-5" />
      <StatusBar
        className="row-start-5 max-[560px]:row-start-6"
        status={runtime.status}
        draftStatus={draftStatus}
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
      />
      <CartridgeDetailsDialog
        open={detailsOpen}
        draft={draft}
        onOpenChange={setDetailsOpen}
        onSave={(nextDraft) => {
          draftRef.current = nextDraft;
          setDraft(nextDraft);
          setDraftStatus("unsaved changes");
        }}
      />
      <NewCartridgeDialog
        open={newCartridgeOpen}
        onOpenChange={setNewCartridgeOpen}
        onSelect={startTemplate}
      />
    </div>
  );
}
