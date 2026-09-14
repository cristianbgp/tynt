import { describe, expect, test } from "vitest";
import { createIframeDocument } from "../src/runtime/iframe-source";

const token = "0123456789abcdef0123456789abcdef";

function iframeHarness(document: string) {
  const script = document.match(/<script[^>]*>([\s\S]*)<\/script>/)?.[1];
  if (!script) throw new Error("missing bootstrap");
  let listener: ((event: { source: unknown; data: unknown }) => void) | undefined;
  const relayed: unknown[] = [];
  const parent = { postMessage: (value: unknown) => relayed.push(value) };
  const window = { addEventListener: (_: string, callback: typeof listener) => { listener = callback; } };
  const workers: FakeWorker[] = [];
  class FakeWorker {
    onmessage?: (event: { data: unknown }) => void;
    onerror?: (event: { message: string }) => void;
    messages: unknown[] = [];
    terminated = false;
    constructor(_url: string) { workers.push(this); }
    postMessage(value: unknown) { this.messages.push(value); }
    terminate() { this.terminated = true; }
  }
  let revoked = false;
  let timerId = 0;
  const timers = new Map<number, { callback: () => void; delay: number }>();
  const URL = { createObjectURL: () => "blob:worker", revokeObjectURL: () => { revoked = true; } };
  Function("window", "parent", "Worker", "Blob", "URL", "setTimeout", "clearTimeout", script)(
    window, parent, FakeWorker, class {}, URL,
    (callback: () => void, delay: number) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    (id: number) => timers.delete(id),
  );
  return {
    send: (source: unknown, data: unknown) => listener?.({ source, data }),
    parent, workers, relayed,
    fire: (delay: number) => [...timers.values()].find((timer) => timer.delay === delay)?.callback(),
    revoked: () => revoked,
  };
}

describe("iframe bootstrap", () => {
  test("declares a restrictive worker-only content security policy", () => {
    const document = createIframeDocument(token);
    expect(document).toContain("default-src 'none'");
    expect(document).toContain("connect-src 'none'");
    expect(document).toContain("worker-src blob:");
    expect(document).not.toContain("allow-same-origin");
  });

  test("accepts boot only from parent with the matching token and relays valid worker events", () => {
    const harness = iframeHarness(createIframeDocument(token));
    harness.send({}, { kind: "boot", token, workerSource: "source" });
    harness.send(harness.parent, { kind: "boot", token: "stale", workerSource: "source" });
    expect(harness.workers).toHaveLength(0);
    harness.send(harness.parent, { kind: "boot", token, workerSource: "source" });
    expect(harness.workers).toHaveLength(1);
    harness.workers[0]!.onmessage?.({ data: { kind: "ready", token } });
    expect(harness.relayed).toEqual([{ kind: "ready", token }]);
  });

  test("terminates and revokes its worker on stop", () => {
    const harness = iframeHarness(createIframeDocument(token));
    harness.send(harness.parent, { kind: "boot", token, workerSource: "source" });
    harness.send(harness.parent, { kind: "stop", token });
    expect(harness.workers[0]!.terminated).toBe(true);
    expect(harness.revoked()).toBe(true);
  });

  test("terminates on lifecycle and heartbeat watchdog deadlines", () => {
    const phaseHarness = iframeHarness(createIframeDocument(token));
    phaseHarness.send(phaseHarness.parent, { kind: "boot", token, workerSource: "source" });
    phaseHarness.workers[0]!.onmessage?.({ data: { kind: "phase", token, phase: "draw", state: "begin" } });
    phaseHarness.fire(100);
    expect(phaseHarness.relayed).toContainEqual({ kind: "error", token, phase: "draw", message: "draw exceeded 100 ms" });
    expect(phaseHarness.workers[0]!.terminated).toBe(true);

    const heartbeatHarness = iframeHarness(createIframeDocument(token));
    heartbeatHarness.send(heartbeatHarness.parent, { kind: "boot", token, workerSource: "source" });
    heartbeatHarness.fire(2000);
    expect(heartbeatHarness.relayed).toContainEqual({ kind: "error", token, phase: "init", message: "Worker stopped responding for 2 seconds" });
    expect(heartbeatHarness.workers[0]!.terminated).toBe(true);
  });
});
