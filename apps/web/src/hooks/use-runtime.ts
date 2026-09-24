import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";
import type { InputName } from "@tynt/core";
import { RuntimeController } from "@/runtime/controller";
import { createRuntimeDebugStore } from "@/runtime/debug-store";
import { CanvasRenderer, type CanvasTarget } from "@/runtime/renderer";
import { useGamepadInput } from "@/hooks/use-gamepad-input";

type RuntimeStatus =
  | "ready"
  | "compiling"
  | "starting"
  | "running"
  | "paused"
  | "stopped"
  | "imported"
  | "exported"
  | "error";

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

interface VisibilitySource {
  readonly visibilityState: "visible" | "hidden";
  addEventListener(type: "visibilitychange", listener: EventListener): void;
  removeEventListener(type: "visibilitychange", listener: EventListener): void;
}

interface VisibilityRuntime {
  pause(): boolean;
  resume(): boolean;
  resetInput(): void;
}

export function observeRuntimeVisibility(
  source: VisibilitySource,
  runtime: VisibilityRuntime,
): () => void {
  let automaticallyPaused = false;
  const syncVisibility = () => {
    if (source.visibilityState === "hidden") {
      if (!automaticallyPaused && runtime.pause()) {
        automaticallyPaused = true;
        runtime.resetInput();
      }
      return;
    }
    if (!automaticallyPaused) return;
    automaticallyPaused = false;
    runtime.resume();
  };
  source.addEventListener("visibilitychange", syncVisibility);
  syncVisibility();
  return () => source.removeEventListener("visibilitychange", syncVisibility);
}

export function useRuntime(soundEnabled = true) {
  const controllerRef = useRef<RuntimeController | null>(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<RuntimeStatus>("ready");
  const [error, setError] = useState("");
  const [showPreviewError, setShowPreviewError] = useState(false);
  const debugStoreRef = useRef(createRuntimeDebugStore());

  const canvasRef: RefCallback<HTMLCanvasElement> = useCallback((canvas) => {
    if (!canvas || typeof CanvasRenderingContext2D === "undefined") return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const renderer = new CanvasRenderer(
      context as unknown as CanvasTarget,
      canvas.width,
      canvas.height,
    );
    renderer.replay([{ op: "clear", color: 0 }]);
    controllerRef.current = RuntimeController.forBrowser(
      (nextStatus) => {
        if (mountedRef.current) setStatus(nextStatus);
      },
      (runtimeError, previewAvailable) => {
        if (!mountedRef.current) return;
        const location =
          runtimeError.line === undefined
            ? ""
            : ` · cartridge.ts:${runtimeError.line}:${runtimeError.column ?? 1}`;
        setError(`${runtimeError.phase}: ${runtimeError.message}${location}`);
        setShowPreviewError(!previewAvailable);
      },
      (frame) => renderer.replay(frame.commands),
      debugStoreRef.current.update,
    );
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.stop();
    };
  }, []);

  useEffect(() => controllerRef.current?.setAudioEnabled(soundEnabled), [soundEnabled]);

  useEffect(
    () =>
      observeRuntimeVisibility(document, {
        pause: () => controllerRef.current?.pause() ?? false,
        resume: () => controllerRef.current?.resume() ?? false,
        resetInput: () => controllerRef.current?.resetInput(),
      }),
    [],
  );

  const run = useCallback(async (source: string) => {
    setError("");
    setShowPreviewError(false);
    return (await controllerRef.current?.run(source)) ?? false;
  }, []);

  const stop = useCallback(() => controllerRef.current?.stop(), []);
  const pause = useCallback(() => controllerRef.current?.pause() ?? false, []);
  const resume = useCallback(() => controllerRef.current?.resume() ?? false, []);
  const step = useCallback(() => controllerRef.current?.step() ?? false, []);
  const setKey = useCallback(
    (code: string, down: boolean) => controllerRef.current?.setKey(code, down) ?? false,
    [],
  );
  const setInput = useCallback(
    (input: InputName, down: boolean) => controllerRef.current?.setInput(input, down),
    [],
  );
  const setGamepadInput = useCallback(
    (input: InputName, down: boolean) => controllerRef.current?.setGamepadInput(input, down),
    [],
  );
  const gamepadConnected = useGamepadInput(setGamepadInput);
  const resetInput = useCallback(() => controllerRef.current?.resetInput(), []);
  const clearError = useCallback(() => {
    setError("");
    setShowPreviewError(false);
  }, []);
  const reportError = useCallback((nextError: unknown) => {
    setError(messageFrom(nextError));
    setShowPreviewError(false);
    setStatus("error");
  }, []);
  const announce = useCallback((nextStatus: "imported" | "exported") => setStatus(nextStatus), []);
  const isRunning =
    status === "starting" || status === "running" || (controllerRef.current?.isRunning ?? false);

  return {
    canvasRef,
    status,
    error,
    showPreviewError,
    isRunning,
    isPaused: status === "paused",
    isCompiling: status === "compiling",
    debugStore: debugStoreRef.current,
    run,
    stop,
    pause,
    resume,
    step,
    setKey,
    setInput,
    gamepadConnected,
    resetInput,
    clearError,
    reportError,
    announce,
  };
}
