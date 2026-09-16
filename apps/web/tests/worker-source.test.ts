import { describe, expect, test } from "vitest";
import { CARTRIDGE_API_NAMES } from "@tynt/core";
import { findPublicCartridge } from "@/cartridges/public-cartridges";
import { compileCartridge } from "../src/runtime/compiler";
import { createWorkerSource } from "../src/runtime/worker-source";

const token = "0123456789abcdef0123456789abcdef";

async function runWorker(source: string) {
  const messages: unknown[] = [];
  let listener: ((event: { data: unknown }) => void) | undefined;
  const self: Record<string, unknown> = {
    postMessage: (message: unknown) => messages.push(message),
    addEventListener: (_type: string, next: (event: { data: unknown }) => void) => { listener = next; },
    fetch: () => "network",
    localStorage: {},
    indexedDB: {},
    Worker: class {},
  };
  Function("self", "globalThis", source)(self, self);
  return {
    messages,
    tick: (data: unknown) => listener?.({ data }),
    globals: self,
  };
}

describe("worker bootstrap", () => {
  test("provides every catalogued cartridge global", () => {
    const source = createWorkerSource("", token);
    for (const name of CARTRIDGE_API_NAMES.filter((value) => !["init", "update", "draw"].includes(value))) {
      expect(source).toMatch(new RegExp(`(?:const|function) ${name}\\b`));
    }
  });
  test("runs init once then update before draw and emits API commands", async () => {
    const compiled = await compileCartridge(`
      let count = 0;
      export function init(){ count++; }
      export function update(){ count++; }
      export function draw(){ clear(0); pixel(count, 1, 3); }
    `);
    const worker = await runWorker(createWorkerSource(compiled.code, token));
    worker.tick({ kind: "tick", token, input: { held: [], pressed: [] } });
    expect(worker.messages.map((value: any) => `${value.kind}:${value.phase ?? ""}:${value.state ?? ""}`)).toEqual([
      "phase:init:begin", "phase:init:complete", "heartbeat::", "ready::",
      "phase:update:begin", "phase:update:complete", "phase:draw:begin", "phase:draw:complete", "frame::", "heartbeat::",
    ]);
    expect((worker.messages.find((value: any) => value.kind === "frame") as any).commands).toEqual([
      { op: "clear", color: 0 }, { op: "pixel", x: 2, y: 1, color: 3 },
    ]);
  });

  test("the sprites cartridge draws the tynt mark as an eight by eight indexed sprite", async () => {
    const cartridge = findPublicCartridge("sprites")!;
    const compiled = await compileCartridge(cartridge.source);
    const worker = await runWorker(createWorkerSource(compiled.code, token));
    worker.tick({ kind: "tick", token, input: { held: [], pressed: [] } });
    const frame = worker.messages.findLast((value: any) => value.kind === "frame") as any;

    expect(frame.commands).toContainEqual({
      op: "sprite",
      pixels: [
        0,0,0,0,0,0,0,0,
        0,3,3,2,2,1,1,0,
        0,3,3,2,2,1,1,0,
        0,0,0,3,3,0,0,0,
        0,0,0,3,3,0,0,0,
        0,0,0,2,2,0,0,0,
        0,0,0,2,2,0,0,0,
        0,0,0,0,0,0,0,0,
      ],
      width: 8,
      height: 8,
      x: 12,
      y: 28,
      transparent: 0,
    });
  });

  test("coin dash starts as a timed five-coin side-scrolling game", async () => {
    const cartridge = findPublicCartridge("coin-dash")!;
    expect(cartridge).toBeDefined();
    const compiled = await compileCartridge(cartridge.source);
    const worker = await runWorker(createWorkerSource(compiled.code, token));
    worker.tick({ kind: "tick", token, input: { held: [], pressed: [] } });
    const frame = worker.messages.findLast((value: any) => value.kind === "frame") as any;

    expect(frame.commands).toEqual(expect.arrayContaining([
      { op: "text", value: "COIN DASH", x: 6, y: 6, color: 3 },
      { op: "text", value: "COINS 0/5", x: 6, y: 18, color: 2 },
      { op: "text", value: "TIME 30", x: 116, y: 6, color: 2 },
    ]));
  });

  test("uses one held and pressed snapshot throughout an update", async () => {
    const compiled = await compileCartridge(`
      let result = 0;
      export function init(){}
      export function update(){ if(button("a")) result++; if(buttonPressed("a")) result += 2; if(buttonPressed("a")) result += 4; }
      export function draw(){ pixel(result, 0, 3); }
    `);
    const worker = await runWorker(createWorkerSource(compiled.code, token));
    worker.tick({ kind: "tick", token, input: { held: ["a"], pressed: ["a"] } });
    expect((worker.messages.findLast((value: any) => value.kind === "frame") as any).commands[0].x).toBe(7);
  });

  test("masks network, storage, messaging, and worker construction globals", async () => {
    const compiled = await compileCartridge(`
      let denied = false;
      export function init(){ denied = [fetch, XMLHttpRequest, WebSocket, WebTransport, RTCPeerConnection, EventSource, importScripts, Worker, SharedWorker, BroadcastChannel, indexedDB, caches, localStorage, navigator, postMessage, Function, typeof __post === "undefined" ? undefined : __post].every(value => value === undefined); }
      export function update(){}
      export function draw(){ pixel(0, 0, denied ? 3 : 1); }
    `);
    const worker = await runWorker(createWorkerSource(compiled.code, token));
    worker.tick({ kind: "tick", token, input: { held: [], pressed: [] } });
    expect((worker.messages.findLast((value: any) => value.kind === "frame") as any).commands[0].color).toBe(3);
    expect(worker.globals.fetch).toBeUndefined();
    expect(worker.globals.Worker).toBeUndefined();
  });

  test("reports API limits and lifecycle errors without an internal stack", async () => {
    const compiled = await compileCartridge(`
      export function init(){}
      export function update(){ throw new Error("player boom"); }
      export function draw(){ text("x".repeat(1025), 0, 0, 1); }
    `);
    const worker = await runWorker(createWorkerSource(compiled.code, token));
    worker.tick({ kind: "tick", token, input: { held: [], pressed: [] } });
    const error = worker.messages.findLast((value: any) => value.kind === "error") as any;
    expect(error.phase).toBe("update");
    expect(error.message).toBe("player boom");
    expect(error.stack).toBeUndefined();
  });

  test("provides deterministic helpers, camera, sprites, maps, and audio", async () => {
    const compiled = await compileCartridge(`
      let value = 0;
      export function init(){ seed(1); value = random(0, 10); tone(440, 80, 0.2); sfx([220, 330], 50); }
      export function update(){ if (overlap(0,0,2,2,1,1,2,2) && pointInRect(1,1,0,0,2,2) && after(1)) value += every(1) ? 1 : 0; }
      export function draw(){ camera(2,3); pixel(10,10,3); sprite([1,0,2,3],2,2,12,13,0); map([0],1,2,2,[1,2,3,0],1,14,15,0); camera(); pixel(value,0,2); }
    `);
    const worker = await runWorker(createWorkerSource(compiled.code, token));
    worker.tick({ kind: "tick", token, input: { held: [], pressed: [] } });
    const frame = worker.messages.findLast((value: any) => value.kind === "frame") as any;
    expect(frame.commands).toEqual([
      { op: "pixel", x: 8, y: 7, color: 3 },
      { op: "sprite", pixels: [1,0,2,3], width: 2, height: 2, x: 10, y: 10, transparent: 0 },
      { op: "map", tiles: [0], columns: 1, tileWidth: 2, tileHeight: 2, spritesheet: [1,2,3,0], sheetColumns: 1, x: 12, y: 12, transparent: 0 },
      { op: "pixel", x: 3.3645552527159452, y: 0, color: 2 },
    ]);
    expect(worker.messages.filter((value: any) => value.kind === "audio")).toEqual([
      { kind: "audio", token, frequency: 440, duration: 80, volume: 0.2, wave: "square", delay: 0 },
      { kind: "audio", token, frequency: 220, duration: 40, volume: 0.15, wave: "square", delay: 0 },
      { kind: "audio", token, frequency: 330, duration: 40, volume: 0.15, wave: "square", delay: 50 },
    ]);
  });

  test("treats zero-frequency sfx steps as timed rests", async () => {
    const compiled = await compileCartridge(`
      export function init(){ sfx([220, 0, 330], 50); }
      export function update(){}
      export function draw(){}
    `);
    const worker = await runWorker(createWorkerSource(compiled.code, token));

    expect(worker.messages.filter((value: any) => value.kind === "audio")).toEqual([
      { kind: "audio", token, frequency: 220, duration: 40, volume: 0.15, wave: "square", delay: 0 },
      { kind: "audio", token, frequency: 330, duration: 40, volume: 0.15, wave: "square", delay: 100 },
    ]);
  });

  test("reports an API error when one frame exceeds its audio budget", async () => {
    const compiled = await compileCartridge(`
      export function init(){ for (let note = 0; note < 65; note++) tone(440); }
      export function update(){}
      export function draw(){}
    `);
    const worker = await runWorker(createWorkerSource(compiled.code, token));
    const error = worker.messages.findLast((value: any) => value.kind === "error") as any;
    expect(worker.messages.filter((value: any) => value.kind === "audio")).toHaveLength(64);
    expect(error.phase).toBe("init");
    expect(error.message).toBe("Frame exceeds 64 audio events");
  });
});
