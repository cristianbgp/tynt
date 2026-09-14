import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";
import type { InputName } from "@tynt/core";
import { RuntimeController } from "@/runtime/controller";
import { CanvasRenderer, type CanvasTarget } from "@/runtime/renderer";

type RuntimeStatus = "ready" | "compiling" | "starting" | "running" | "stopped" | "imported" | "exported" | "error";

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useRuntime(soundEnabled = true) {
  const controllerRef = useRef<RuntimeController | null>(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<RuntimeStatus>("ready");
  const [error, setError] = useState("");
  const [showPreviewError, setShowPreviewError] = useState(false);

  const canvasRef: RefCallback<HTMLCanvasElement> = useCallback((canvas) => {
    if (!canvas || typeof CanvasRenderingContext2D === "undefined") return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const renderer = new CanvasRenderer(context as unknown as CanvasTarget, canvas.width, canvas.height);
    renderer.replay([{ op: "clear", color: 0 }]);
    controllerRef.current = RuntimeController.forBrowser(
      (nextStatus) => {
        if (mountedRef.current) setStatus(nextStatus);
      },
      (runtimeError, previewAvailable) => {
        if (!mountedRef.current) return;
        const location = runtimeError.line === undefined ? "" : ` · cartridge.ts:${runtimeError.line}:${runtimeError.column ?? 1}`;
        setError(`${runtimeError.phase}: ${runtimeError.message}${location}`);
        setShowPreviewError(!previewAvailable);
      },
      (frame) => renderer.replay(frame.commands),
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

  const run = useCallback(async (source: string) => {
    setError("");
    setShowPreviewError(false);
    return await controllerRef.current?.run(source) ?? false;
  }, []);

  const stop = useCallback(() => controllerRef.current?.stop(), []);
  const setKey = useCallback((code: string, down: boolean) => controllerRef.current?.setKey(code, down) ?? false, []);
  const setInput = useCallback((input: InputName, down: boolean) => controllerRef.current?.setInput(input, down), []);
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
  const isRunning = status === "starting" || status === "running" || (controllerRef.current?.isRunning ?? false);

  return {
    canvasRef,
    status,
    error,
    showPreviewError,
    isRunning,
    isCompiling: status === "compiling",
    run,
    stop,
    setKey,
    setInput,
    resetInput,
    clearError,
    reportError,
    announce,
  };
}
