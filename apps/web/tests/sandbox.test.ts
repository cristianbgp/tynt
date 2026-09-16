import { expect, test } from "vitest";
import { SandboxRun, type SandboxEnvironment, type SandboxFrame } from "../src/runtime/sandbox";

const compiled = { code: "var __tyntCartridge={init(){},update(){},draw(){}}", map: "{}" };

function harness({ deferLoad = false } = {}) {
  let messageListener: ((event: MessageEvent) => void) | undefined;
  let loadListener: (() => void) | undefined;
  const posted: unknown[] = [];
  const contentWindow = { postMessage: (value: unknown) => posted.push(value) };
  const iframe = {
    contentWindow,
    srcdoc: "",
    removed: false,
    dataset: {} as Record<string, string>,
    setSandbox: (_value: string) => {},
    addEventListener: (_: "load", callback: () => void) => { loadListener = callback; },
    remove: () => { iframe.removed = true; },
  };
  const environment: SandboxEnvironment = {
    createIframe: () => iframe,
    appendIframe: () => { if (!deferLoad) loadListener?.(); },
    addMessageListener: (callback) => { messageListener = callback; },
    removeMessageListener: (callback) => { if (messageListener === callback) messageListener = undefined; },
  };
  return {
    environment,
    iframe,
    posted,
    load: () => loadListener?.(),
    emit: (source: unknown, data: unknown) => messageListener?.({ source, data } as MessageEvent),
  };
}

test("checks iframe source and run token before delivering frames", () => {
  const testbed = harness();
  const frames: SandboxFrame[] = [];
  const run = new SandboxRun(compiled, { onFrame: (frame) => frames.push(frame) }, testbed.environment, "0123456789abcdef0123456789abcdef");
  run.start();
  testbed.emit({}, { kind: "frame", token: run.token, commands: [{ op: "clear", color: 0 }] });
  testbed.emit(testbed.iframe.contentWindow, { kind: "frame", token: "stale", commands: [{ op: "clear", color: 0 }] });
  expect(frames).toHaveLength(0);
  expect(run.isActive).toBe(false);
});

test("delivers valid frames and tears down idempotently", () => {
  const testbed = harness();
  const frames: SandboxFrame[] = [];
  const run = new SandboxRun(compiled, { onFrame: (frame) => frames.push(frame) }, testbed.environment, "0123456789abcdef0123456789abcdef");
  run.start();
  testbed.emit(testbed.iframe.contentWindow, { kind: "frame", token: run.token, commands: [{ op: "pixel", x: 1, y: 2, color: 3 }] });
  expect(frames[0]?.commands).toEqual([{ op: "pixel", x: 1, y: 2, color: 3 }]);
  run.stop();
  run.stop();
  expect(testbed.iframe.removed).toBe(true);
  expect(run.isActive).toBe(false);
});

test("preserves suspension when the iframe finishes loading afterward", () => {
  const testbed = harness({ deferLoad: true });
  const run = new SandboxRun(compiled, {}, testbed.environment, "0123456789abcdef0123456789abcdef");
  run.start();
  run.suspend();
  testbed.load();

  expect(testbed.posted.at(-1)).toEqual({ kind: "suspend", token: run.token });
});

test("delivers validated audio requests", () => {
  const testbed = harness();
  const audio: unknown[] = [];
  const run = new SandboxRun(compiled, { onAudio: (command) => audio.push(command) }, testbed.environment, "0123456789abcdef0123456789abcdef");
  run.start();
  testbed.emit(testbed.iframe.contentWindow, { kind: "audio", token: run.token, frequency: 440, duration: 80, volume: 0.2, wave: "square", delay: 10 });
  expect(audio).toEqual([{ frequency: 440, duration: 80, volume: 0.2, wave: "square", delay: 10 }]);
});

test("terminates a run that floods audio messages", () => {
  const testbed = harness();
  const audio: unknown[] = [];
  const errors: string[] = [];
  const run = new SandboxRun(
    compiled,
    { onAudio: (command) => audio.push(command), onError: (error) => errors.push(error.message) },
    testbed.environment,
    "0123456789abcdef0123456789abcdef",
    () => 100,
  );
  run.start();
  for (let index = 0; index < 65; index++) {
    testbed.emit(testbed.iframe.contentWindow, { kind: "audio", token: run.token, frequency: 440, duration: 80, volume: 0.2, wave: "square", delay: 0 });
  }
  expect(audio).toHaveLength(64);
  expect(errors).toEqual(["Cartridge exceeded 64 audio events per second"]);
  expect(run.isActive).toBe(false);
  expect(testbed.iframe.removed).toBe(true);
});

test("terminates a run after its lifetime audio budget is exhausted", () => {
  const testbed = harness();
  const errors: string[] = [];
  let now = 0;
  const run = new SandboxRun(
    compiled,
    { onError: (error) => errors.push(error.message) },
    testbed.environment,
    "0123456789abcdef0123456789abcdef",
    () => now,
  );
  run.start();
  for (let index = 0; index < 36_001; index++) {
    if (index > 0 && index % 64 === 0) now += 1_001;
    testbed.emit(testbed.iframe.contentWindow, { kind: "audio", token: run.token, frequency: 440, duration: 80, volume: 0.2, wave: "square", delay: 0 });
  }
  expect(errors).toEqual(["Cartridge exceeded 36,000 audio events in one run"]);
  expect(run.isActive).toBe(false);
});

test("malformed current-source messages terminate the run", () => {
  const testbed = harness();
  const errors: string[] = [];
  const run = new SandboxRun(compiled, { onError: (error) => errors.push(error.message) }, testbed.environment, "0123456789abcdef0123456789abcdef");
  run.start();
  testbed.emit(testbed.iframe.contentWindow, { kind: "frame", token: run.token, commands: [{ op: "pixel", x: NaN }] });
  expect(errors[0]).toMatch(/invalid/i);
  expect(testbed.iframe.removed).toBe(true);
});
