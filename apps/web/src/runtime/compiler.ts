import { originalPositionFor, TraceMap } from "@jridgewell/trace-mapping";
import { initialize, transform as esbuildTransform, type TransformOptions, type TransformResult } from "esbuild-wasm";
import wasmUrl from "esbuild-wasm/esbuild.wasm?url";
import { MAX_SOURCE_BYTES } from "@tynt/core";
import { MAX_COMPILED_BYTES } from "./protocol";

export interface CompiledCartridge {
  code: string;
  map: string;
}

type Transform = (source: string, options: TransformOptions) => Promise<Pick<TransformResult, "code" | "map">>;

let initializePromise: Promise<void> | undefined;

async function ensureCompiler(): Promise<void> {
  if (typeof window === "undefined") return;
  initializePromise ??= initialize({ wasmURL: wasmUrl, worker: true });
  await initializePromise;
}

function compilerMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "errors" in error && Array.isArray((error as { errors: unknown[] }).errors)) {
    const first = (error as { errors: Array<{ text?: string; location?: { line: number; column: number } }> }).errors[0];
    if (first) {
      const location = first.location ? `cartridge.ts:${first.location.line}:${first.location.column + 1}: ` : "";
      return `${location}${first.text ?? "TypeScript compilation failed"}`;
    }
  }
  return error instanceof Error ? error.message : String(error);
}

function exportedNames(code: string): Set<string> {
  const names = new Set<string>();
  for (const match of code.matchAll(/export\s*{([\s\S]*?)}/g)) {
    for (const item of match[1]!.split(",")) {
      const pair = item.trim().split(/\s+as\s+/);
      if (pair[0]) names.add((pair[1] ?? pair[0]).trim());
    }
  }
  return names;
}

function withoutCommentsAndQuotedStrings(code: string): string {
  let result = "";
  let state: "code" | "single" | "double" | "line" | "block" = "code";
  for (let index = 0; index < code.length; index++) {
    const character = code[index]!;
    const next = code[index + 1];
    if (state === "code" && character === "/" && next === "/") { state = "line"; result += "  "; index++; continue; }
    if (state === "code" && character === "/" && next === "*") { state = "block"; result += "  "; index++; continue; }
    if (state === "line" && character === "\n") { state = "code"; result += "\n"; continue; }
    if (state === "block" && character === "*" && next === "/") { state = "code"; result += "  "; index++; continue; }
    if (state === "line" || state === "block") { result += " "; continue; }
    if (state === "code" && character === "'") { state = "single"; result += " "; continue; }
    if (state === "code" && character === '"') { state = "double"; result += " "; continue; }
    if ((state === "single" || state === "double") && character === "\\") { result += "  "; index++; continue; }
    if (state === "single" && character === "'") { state = "code"; result += " "; continue; }
    if (state === "double" && character === '"') { state = "code"; result += " "; continue; }
    result += state === "code" ? character : " ";
  }
  return result;
}

function containsImport(code: string): boolean {
  return /(^|[^\w$.])import\b\s*(?:\(|["'{*]|[\w$])/m.test(withoutCommentsAndQuotedStrings(code));
}

export async function compileCartridge(source: string, options: { transform?: Transform } = {}): Promise<CompiledCartridge> {
  if (new TextEncoder().encode(source).byteLength > MAX_SOURCE_BYTES) throw new Error("Cartridge source exceeds 256 KiB");
  if (containsImport(source)) throw new Error("Cartridge imports are not available in tynt v1");
  await ensureCompiler();
  let esm: Pick<TransformResult, "code" | "map">;
  try {
    esm = await esbuildTransform(source, {
      loader: "ts",
      format: "esm",
      target: "es2022",
      sourcefile: "cartridge.ts",
      sourcemap: false,
    });
  } catch (error) {
    throw new Error(compilerMessage(error));
  }
  const exports = exportedNames(esm.code);
  for (const lifecycle of ["init", "update", "draw"]) {
    if (!exports.has(lifecycle)) throw new Error(`Cartridge must export function ${lifecycle}()`);
  }
  const runTransform = options.transform ?? esbuildTransform;
  let result: Pick<TransformResult, "code" | "map">;
  try {
    result = await runTransform(source, {
      loader: "ts",
      format: "iife",
      globalName: "__tyntCartridge",
      target: "es2022",
      sourcefile: "cartridge.ts",
      sourcemap: "external",
      legalComments: "none",
    });
  } catch (error) {
    throw new Error(compilerMessage(error));
  }
  if (new TextEncoder().encode(result.code).byteLength > MAX_COMPILED_BYTES) {
    throw new Error("Compiled cartridge exceeds 1 MiB");
  }
  return { code: result.code, map: result.map };
}

export function mapGeneratedPosition(map: string, line: number, column: number): { line: number; column: number } | null {
  try {
    const position = originalPositionFor(new TraceMap(map), { line, column });
    if (position.line === null || position.column === null) return null;
    return { line: position.line, column: position.column + 1 };
  } catch {
    return null;
  }
}
