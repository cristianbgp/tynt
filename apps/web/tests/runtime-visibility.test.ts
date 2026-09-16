import { describe, expect, test, vi } from "vitest";
import * as runtimeHook from "../src/hooks/use-runtime";

class VisibilityDocument extends EventTarget {
  visibilityState: "visible" | "hidden" = "visible";

  setVisibility(state: "visible" | "hidden"): void {
    this.visibilityState = state;
    this.dispatchEvent(new Event("visibilitychange"));
  }
}

function observer() {
  const value = (runtimeHook as Record<string, unknown>).observeRuntimeVisibility;
  expect(value).toBeTypeOf("function");
  return value as (
    document: VisibilityDocument,
    runtime: { pause(): boolean; resume(): boolean; resetInput(): void },
  ) => () => void;
}

describe("runtime page visibility", () => {
  test("pauses a running game while hidden and resumes it when visible", () => {
    const document = new VisibilityDocument();
    const runtime = {
      pause: vi.fn(() => true),
      resume: vi.fn(() => true),
      resetInput: vi.fn(),
    };
    const disconnect = observer()(document, runtime);

    document.setVisibility("hidden");
    expect(runtime.pause).toHaveBeenCalledOnce();
    expect(runtime.resetInput).toHaveBeenCalledOnce();

    document.setVisibility("visible");
    expect(runtime.resume).toHaveBeenCalledOnce();

    disconnect();
  });

  test("does not resume a game that was already manually paused", () => {
    const document = new VisibilityDocument();
    const runtime = {
      pause: vi.fn(() => false),
      resume: vi.fn(() => true),
      resetInput: vi.fn(),
    };
    const disconnect = observer()(document, runtime);

    document.setVisibility("hidden");
    document.setVisibility("visible");

    expect(runtime.resetInput).not.toHaveBeenCalled();
    expect(runtime.resume).not.toHaveBeenCalled();
    disconnect();
  });
});
