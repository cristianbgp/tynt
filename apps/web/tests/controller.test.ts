import { expect, test } from "vitest";
import { RuntimeController, type RuntimeDependencies, type RuntimeRun } from "../src/runtime/controller";

const compiled = { code: "compiled", map: "{}" };

function harness() {
  const events: string[] = [];
  const debugStates: Array<{ frame: number; held: readonly string[]; pressed: readonly string[] }> = [];
  const runs: Array<RuntimeRun & { ready(): void; fail(): void; ticks: unknown[]; stopped: boolean }> = [];
  let frame: ((time: number) => void) | undefined;
  let compileFails = false;
  let now = 0;
  const dependencies: RuntimeDependencies = {
    compile: async () => { events.push("compile"); if (compileFails) throw new Error("bad source"); return compiled; },
    createRun: (_compiled, callbacks) => {
      const run = {
        isActive: true,
        ticks: [] as unknown[],
        stopped: false,
        start() { events.push("start"); },
        tick(input: unknown) { this.ticks.push(input); },
        stop() { if (!this.stopped) { this.stopped = true; this.isActive = false; events.push("stop"); callbacks.onStop?.(); } },
        ready() { callbacks.onReady?.(); },
        fail() { callbacks.onError?.({ phase: "update", message: "boom" }); callbacks.onStop?.(); },
      };
      runs.push(run);
      return run;
    },
    requestFrame: (callback) => { frame = callback; return 1; },
    cancelFrame: () => { frame = undefined; },
    now: () => now,
    onStatus: (status) => events.push(status),
    onError: (error) => events.push(`error:${error.message}`),
    onAudio: (audio) => events.push(`audio:${audio.frequency}`),
    onAudioStop: () => events.push("audio:stop"),
    onDebugState: (state) => debugStates.push(state),
  };
  return { dependencies, debugStates, events, runs, frame: (time: number) => frame?.(time), setNow: (value: number) => { now = value; }, failCompile: () => { compileFails = true; } };
}

test("compiles successfully before replacing an active run", async () => {
  const testbed = harness();
  const controller = new RuntimeController(testbed.dependencies);
  await controller.run("first");
  testbed.runs[0]!.ready();
  await controller.run("second");
  expect(testbed.events.indexOf("compile")).toBeLessThan(testbed.events.indexOf("start"));
  expect(testbed.events.lastIndexOf("compile")).toBeLessThan(testbed.events.lastIndexOf("stop"));
  expect(testbed.events.lastIndexOf("stop")).toBeLessThan(testbed.events.lastIndexOf("start"));
});

test("compile failure preserves an active run", async () => {
  const testbed = harness();
  const controller = new RuntimeController(testbed.dependencies);
  await controller.run("good");
  testbed.failCompile();
  await controller.run("bad");
  expect(testbed.runs[0]!.stopped).toBe(false);
  expect(testbed.events).toContain("error:bad source");
});

test("fixed frames send update snapshots and stop resets input", async () => {
  const testbed = harness();
  const controller = new RuntimeController(testbed.dependencies);
  await controller.run("good");
  testbed.runs[0]!.ready();
  controller.setKey("KeyZ", true);
  testbed.frame(17);
  expect(testbed.runs[0]!.ticks).toEqual([{ held: ["a"], pressed: ["a"] }]);
  controller.stop();
  expect(controller.isRunning).toBe(false);
  expect(testbed.events).toContain("audio:stop");
});

test("direct emulator inputs use the same runtime snapshots", async () => {
  const testbed = harness();
  const controller = new RuntimeController(testbed.dependencies);
  await controller.run("good");
  testbed.runs[0]!.ready();
  controller.setInput("right", true);
  testbed.frame(17);
  expect(testbed.runs[0]!.ticks).toEqual([{ held: ["right"], pressed: ["right"] }]);
  controller.setInput("right", false);
  testbed.frame(34);
  expect(testbed.runs[0]!.ticks.at(-1)).toEqual({ held: [], pressed: [] });
});

test("runtime failure stops scheduling and reports the error", async () => {
  const testbed = harness();
  const controller = new RuntimeController(testbed.dependencies);
  await controller.run("good");
  testbed.runs[0]!.ready();
  testbed.runs[0]!.fail();
  expect(testbed.events).toContain("error:boom");
  expect(controller.isRunning).toBe(false);
});

test("a newer run request supersedes an older compilation", async () => {
  const testbed = harness();
  const resolvers: Array<(value: typeof compiled) => void> = [];
  testbed.dependencies.compile = () => new Promise((resolve) => resolvers.push(resolve));
  const controller = new RuntimeController(testbed.dependencies);
  const older = controller.run("older");
  const newer = controller.run("newer");
  resolvers[1]!(compiled);
  await newer;
  resolvers[0]!(compiled);
  await older;
  expect(testbed.runs).toHaveLength(1);
  expect(testbed.runs[0]!.stopped).toBe(false);
});

test("pause prevents scheduled updates and resume discards elapsed wall time", async () => {
  const testbed = harness();
  const controller = new RuntimeController(testbed.dependencies);
  await controller.run("good");
  testbed.runs[0]!.ready();

  expect(controller.pause()).toBe(true);
  expect(controller.isPaused).toBe(true);
  testbed.frame(5000);
  expect(testbed.runs[0]!.ticks).toEqual([]);

  testbed.setNow(5000);
  expect(controller.resume()).toBe(true);
  testbed.frame(5000);
  expect(testbed.runs[0]!.ticks).toEqual([]);
  testbed.frame(5017);
  expect(testbed.runs[0]!.ticks).toHaveLength(1);
  expect(controller.isPaused).toBe(false);
});

test("step executes exactly one update while paused and reports its input", async () => {
  const testbed = harness();
  const controller = new RuntimeController(testbed.dependencies);
  await controller.run("good");
  testbed.runs[0]!.ready();
  controller.setInput("a", true);
  controller.pause();

  expect(controller.step()).toBe(true);
  expect(controller.step()).toBe(true);

  expect(testbed.runs[0]!.ticks).toEqual([
    { held: ["a"], pressed: ["a"] },
    { held: ["a"], pressed: [] },
  ]);
  expect(testbed.debugStates.at(-1)).toEqual({ frame: 2, held: ["a"], pressed: [] });
});

test("stop resets paused, frame, and inspected input state", async () => {
  const testbed = harness();
  const controller = new RuntimeController(testbed.dependencies);
  await controller.run("good");
  testbed.runs[0]!.ready();
  controller.setInput("right", true);
  controller.pause();
  controller.step();

  controller.stop();

  expect(controller.isPaused).toBe(false);
  expect(testbed.debugStates.at(-1)).toEqual({ frame: 0, held: [], pressed: [] });
});
