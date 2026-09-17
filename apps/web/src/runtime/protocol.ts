import { INPUT_NAMES, type DrawCommand, type InputName, type InputSnapshot } from "@tynt/core";

export const MAX_COMMANDS = 32_768;
export const MAX_FRAME_BYTES = 1024 * 1024;
export const MAX_TEXT_CODE_POINTS = 1_024;
export const MAX_COMPILED_BYTES = 1024 * 1024;

export type LifecyclePhase = "init" | "update" | "draw";
export type ErrorPhase = LifecyclePhase | "api" | "protocol" | "timeout";
export type AudioWave = "square" | "sine" | "triangle" | "sawtooth";
export interface CartridgeAudio {
  frequency: number;
  duration: number;
  volume: number;
  wave: AudioWave;
  delay: number;
}

export type HostMessage =
  | { kind: "boot"; token: string; workerSource: string }
  | { kind: "tick"; token: string; input: InputSnapshot }
  | { kind: "stop"; token: string };

export type IframeMessage =
  | { kind: "ready"; token: string }
  | { kind: "phase"; token: string; phase: LifecyclePhase; state: "begin" | "complete" }
  | { kind: "heartbeat"; token: string }
  | { kind: "frame"; token: string; commands: DrawCommand[] }
  | ({ kind: "audio"; token: string } & CartridgeAudio)
  | {
      kind: "error";
      token: string;
      phase: ErrorPhase;
      message: string;
      line?: number;
      column?: number;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readToken(value: Record<string, unknown>, expectedToken: string): string {
  if (value.token !== expectedToken) throw new Error("Sandbox message token is invalid");
  return expectedToken;
}

function inputList(value: unknown): InputName[] {
  if (!Array.isArray(value) || value.some((item) => !INPUT_NAMES.includes(item as InputName))) {
    throw new Error("Sandbox input snapshot is invalid");
  }
  return INPUT_NAMES.filter((input) => value.includes(input));
}

function parseInput(value: unknown): InputSnapshot {
  if (!isRecord(value)) throw new Error("Sandbox input snapshot is invalid");
  return {
    held: inputList(value.held),
    pressed: inputList(value.pressed),
    released: inputList(value.released),
  };
}

export function encodedBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function parseCommand(value: unknown): DrawCommand {
  if (!isRecord(value) || typeof value.op !== "string")
    throw new Error("Drawing command is invalid");
  const number = (key: string): number => {
    if (!finite(value[key])) throw new Error("Drawing command is invalid");
    return value[key];
  };
  const color = () => number("color");
  const numbers = (key: string, maximum: number): number[] => {
    const list = value[key];
    if (!Array.isArray(list) || list.length > maximum || list.some((item) => !finite(item)))
      throw new Error("Drawing command is invalid");
    return list;
  };
  const positiveInteger = (key: string, maximum: number): number => {
    const result = number(key);
    if (!Number.isInteger(result) || result < 1 || result > maximum)
      throw new Error("Drawing command is invalid");
    return result;
  };
  switch (value.op) {
    case "clear":
      return { op: "clear", color: color() };
    case "pixel":
      return { op: "pixel", x: number("x"), y: number("y"), color: color() };
    case "line":
      return {
        op: "line",
        x0: number("x0"),
        y0: number("y0"),
        x1: number("x1"),
        y1: number("y1"),
        color: color(),
      };
    case "rect":
      if (typeof value.fill !== "boolean") throw new Error("Drawing command is invalid");
      return {
        op: "rect",
        x: number("x"),
        y: number("y"),
        width: number("width"),
        height: number("height"),
        color: color(),
        fill: value.fill,
      };
    case "circle":
      if (typeof value.fill !== "boolean") throw new Error("Drawing command is invalid");
      return {
        op: "circle",
        x: number("x"),
        y: number("y"),
        radius: number("radius"),
        color: color(),
        fill: value.fill,
      };
    case "triangle":
      if (typeof value.fill !== "boolean") throw new Error("Drawing command is invalid");
      return {
        op: "triangle",
        x1: number("x1"),
        y1: number("y1"),
        x2: number("x2"),
        y2: number("y2"),
        x3: number("x3"),
        y3: number("y3"),
        color: color(),
        fill: value.fill,
      };
    case "text":
      if (typeof value.value !== "string") throw new Error("Drawing command is invalid");
      if ([...value.value].length > MAX_TEXT_CODE_POINTS)
        throw new Error("text() accepts at most 1,024 characters");
      return { op: "text", value: value.value, x: number("x"), y: number("y"), color: color() };
    case "sprite": {
      const pixels = numbers("pixels", 65_536);
      const width = positiveInteger("width", 160);
      const height = positiveInteger("height", 144);
      if (pixels.length !== width * height)
        throw new Error("Sprite pixels must match its width and height");
      return {
        op: "sprite",
        pixels,
        width,
        height,
        x: number("x"),
        y: number("y"),
        transparent: number("transparent"),
      };
    }
    case "map": {
      const tiles = numbers("tiles", 16_384);
      const columns = positiveInteger("columns", 16_384);
      const tileWidth = positiveInteger("tileWidth", 160);
      const tileHeight = positiveInteger("tileHeight", 144);
      const spritesheet = numbers("spritesheet", 65_536);
      const sheetColumns = positiveInteger("sheetColumns", 8_192);
      if (tiles.length * tileWidth * tileHeight > 65_536)
        throw new Error("Map draws more than 65,536 pixels");
      const sheetRowWidth = sheetColumns * tileWidth;
      if (spritesheet.length === 0 || spritesheet.length % (sheetRowWidth * tileHeight) !== 0)
        throw new Error("Map spritesheet dimensions are invalid");
      const tileCount = spritesheet.length / (tileWidth * tileHeight);
      if (tiles.some((tile) => !Number.isInteger(tile) || tile < 0 || tile >= tileCount))
        throw new Error("Map tile index is invalid");
      return {
        op: "map",
        tiles,
        columns,
        tileWidth,
        tileHeight,
        spritesheet,
        sheetColumns,
        x: number("x"),
        y: number("y"),
        transparent: number("transparent"),
      };
    }
    default:
      throw new Error("Drawing command is invalid");
  }
}

export function validateFrame(commands: unknown): DrawCommand[] {
  if (!Array.isArray(commands)) throw new Error("Frame commands are invalid");
  if (commands.length > MAX_COMMANDS) throw new Error("Frame exceeds 32,768 drawing commands");
  const parsed = commands.map(parseCommand);
  if (encodedBytes({ kind: "frame", token: "0".repeat(32), commands: parsed }) > MAX_FRAME_BYTES) {
    throw new Error("Frame message exceeds 1 MiB");
  }
  return parsed;
}

function phase(value: unknown): LifecyclePhase {
  if (value !== "init" && value !== "update" && value !== "draw")
    throw new Error("Lifecycle phase is invalid");
  return value;
}

function errorPhase(value: unknown): ErrorPhase {
  if (value === "api" || value === "protocol" || value === "timeout") return value;
  return phase(value);
}

function optionalPosition(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || (value as number) < 0)
    throw new Error("Error source position is invalid");
  return value as number;
}

export function parseHostMessage(value: unknown, expectedToken: string): HostMessage {
  if (!isRecord(value)) throw new Error("Host message is invalid");
  const token = readToken(value, expectedToken);
  if (value.kind === "boot" && typeof value.workerSource === "string")
    return { kind: "boot", token, workerSource: value.workerSource };
  if (value.kind === "tick") return { kind: "tick", token, input: parseInput(value.input) };
  if (value.kind === "stop") return { kind: "stop", token };
  throw new Error("Host message is invalid");
}

export function parseIframeMessage(value: unknown, expectedToken: string): IframeMessage {
  if (!isRecord(value)) throw new Error("Iframe message is invalid");
  const token = readToken(value, expectedToken);
  if (value.kind === "ready") return { kind: "ready", token };
  if (value.kind === "heartbeat") return { kind: "heartbeat", token };
  if (value.kind === "phase" && (value.state === "begin" || value.state === "complete")) {
    return { kind: "phase", token, phase: phase(value.phase), state: value.state };
  }
  if (value.kind === "frame") {
    if (encodedBytes(value) > MAX_FRAME_BYTES) throw new Error("Frame message exceeds 1 MiB");
    return { kind: "frame", token, commands: validateFrame(value.commands) };
  }
  if (value.kind === "audio") {
    const frequency = value.frequency;
    const duration = value.duration;
    const volume = value.volume;
    const delay = value.delay;
    const wave = value.wave;
    if (
      !finite(frequency) ||
      frequency < 20 ||
      frequency > 20_000 ||
      !finite(duration) ||
      duration < 1 ||
      duration > 5_000 ||
      !finite(volume) ||
      volume < 0 ||
      volume > 1 ||
      !finite(delay) ||
      delay < 0 ||
      delay > 10_000 ||
      (wave !== "square" && wave !== "sine" && wave !== "triangle" && wave !== "sawtooth")
    ) {
      throw new Error("Cartridge audio message is invalid");
    }
    return { kind: "audio", token, frequency, duration, volume, wave, delay };
  }
  if (value.kind === "error" && typeof value.message === "string") {
    return {
      kind: "error",
      token,
      phase: errorPhase(value.phase),
      message: value.message.slice(0, 4096),
      line: optionalPosition(value.line),
      column: optionalPosition(value.column),
    };
  }
  throw new Error("Iframe message is invalid");
}

export function newRunToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
