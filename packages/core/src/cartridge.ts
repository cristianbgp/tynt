import { CANVAS_HEIGHT, CANVAS_WIDTH, PALETTE } from "./api";

export { CANVAS_HEIGHT, CANVAS_WIDTH, PALETTE } from "./api";
/** Maximum UTF-8 byte length accepted for cartridge source. */
export const MAX_SOURCE_BYTES = 256 * 1024;
/** Maximum number of Unicode code points accepted for a cartridge title. */
export const MAX_TITLE_CODE_POINTS = 120;
/** Maximum number of Unicode code points accepted for a cartridge author. */
export const MAX_AUTHOR_CODE_POINTS = 80;
/** Maximum number of Unicode code points accepted for a cartridge description. */
export const MAX_DESCRIPTION_CODE_POINTS = 280;
/** Maximum number of Unicode code points accepted for cartridge control instructions. */
export const MAX_CONTROLS_CODE_POINTS = 160;

/** Editable cartridge fields before fixed format metadata is added. */
export interface Draft {
  /** Human-readable cartridge title. */
  title: string;
  /** TypeScript cartridge source. */
  source: string;
  /** Optional creator name. */
  author?: string;
  /** Optional short cartridge summary. */
  description?: string;
  /** Optional human-readable input guide. */
  controls?: string;
}

/** A complete cartridge draft that can be imported, exported, or published. */
export interface CompleteDraft extends Draft {
  /** Human-readable cartridge title. */
  title: string;
  /** Creator name. */
  author: string;
  /** Short cartridge summary. */
  description: string;
  /** Human-readable input guide. */
  controls: string;
  /** TypeScript cartridge source. */
  source: string;
}

/** The serialized cartridge format supported by tynt version 1. */
export interface TyntCartridgeV1 extends CompleteDraft {
  /** Identifies this file as a tynt cartridge. */
  format: "tynt";
  /** Cartridge format version. */
  version: 1;
  /** Fixed canvas metadata. */
  canvas: {
    /** Canvas width in pixels. */
    width: 160;
    /** Canvas height in pixels. */
    height: 144;
  };
  /** Fixed indexed palette metadata. */
  palette: {
    /** Palette addressing model. */
    model: "indexed";
    /** Colors ordered from index 0 through index 3. */
    colors: ["#000000", "#555555", "#aaaaaa", "#ffffff"];
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Trims a cartridge title and substitutes `untitled` when it is blank.
 * @param value - Untrusted title text.
 * @returns A non-empty title.
 */
export function normalizeTitle(value: string): string {
  return value.trim() || "untitled";
}

function optionalText(value: unknown, label: string, limit: number): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`Cartridge ${label} must be a string`);
  const normalized = value.trim();
  if (!normalized) return undefined;
  if ([...normalized].length > limit) {
    throw new Error(`Cartridge ${label} must be at most ${limit} characters`);
  }
  return normalized;
}

function requiredText(value: unknown, label: string, limit: number): string {
  if (value === undefined || typeof value === "string" && !value.trim()) {
    throw new Error(`Cartridge ${label} is required`);
  }
  if (typeof value !== "string") throw new Error(`Cartridge ${label} must be a string`);
  const normalized = value.trim();
  if ([...normalized].length > limit) {
    throw new Error(`Cartridge ${label} must be at most ${limit} characters`);
  }
  return normalized;
}

function validateCompleteDraft(value: unknown): CompleteDraft {
  if (!isRecord(value)) throw new Error("Cartridge must be an object");
  const title = requiredText(value.title, "title", MAX_TITLE_CODE_POINTS);
  const author = requiredText(value.author, "author", MAX_AUTHOR_CODE_POINTS);
  const description = requiredText(value.description, "description", MAX_DESCRIPTION_CODE_POINTS);
  const controls = requiredText(value.controls, "controls", MAX_CONTROLS_CODE_POINTS);
  if (value.source === undefined || typeof value.source === "string" && !value.source.trim()) {
    throw new Error("Cartridge source is required");
  }
  if (typeof value.source !== "string") throw new Error("Cartridge source must be a string");
  if (new TextEncoder().encode(value.source).byteLength > MAX_SOURCE_BYTES) {
    throw new Error("Cartridge source exceeds 256 KiB");
  }
  return { title, author, description, controls, source: value.source };
}

function rejectUnknownFields(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const known = new Set(allowed);
  const unknown = Object.keys(value).find((key) => !known.has(key));
  if (unknown) throw new Error(`Unknown ${label} field: ${unknown}`);
}

/**
 * Validates and normalizes editable cartridge fields.
 * @param value - Untrusted value to validate.
 * @returns A normalized draft containing editable fields that were provided.
 * @throws If the fields have the wrong types or exceed cartridge limits.
 */
export function validateDraft(value: unknown): Draft {
  if (!isRecord(value) || typeof value.title !== "string" || typeof value.source !== "string") {
    throw new Error("Cartridge title and source must be strings");
  }
  const title = normalizeTitle(value.title);
  if ([...title].length > MAX_TITLE_CODE_POINTS) {
    throw new Error("Cartridge title must be at most 120 characters");
  }
  if (new TextEncoder().encode(value.source).byteLength > MAX_SOURCE_BYTES) {
    throw new Error("Cartridge source exceeds 256 KiB");
  }
  const author = optionalText(value.author, "author", MAX_AUTHOR_CODE_POINTS);
  const description = optionalText(value.description, "description", MAX_DESCRIPTION_CODE_POINTS);
  const controls = optionalText(value.controls, "controls", MAX_CONTROLS_CODE_POINTS);
  return {
    title,
    source: value.source,
    ...(author ? { author } : {}),
    ...(description ? { description } : {}),
    ...(controls ? { controls } : {}),
  };
}

function hasFixedCanvas(value: unknown): boolean {
  return isRecord(value) && value.width === CANVAS_WIDTH && value.height === CANVAS_HEIGHT;
}

function hasFixedPalette(value: unknown): boolean {
  const colors = isRecord(value) && Array.isArray(value.colors) ? value.colors : null;
  return (
    isRecord(value) &&
    value.model === "indexed" &&
    colors !== null &&
    colors.length === PALETTE.length &&
    PALETTE.every((color, index) => colors[index] === color)
  );
}

/**
 * Parses and validates a version 1 cartridge file.
 * @param text - UTF-8 JSON cartridge text.
 * @returns A normalized version 1 cartridge.
 * @throws If the JSON shape, metadata, source, format, version, canvas, or palette is invalid.
 * @example
 * ```ts
 * const cartridge = parseCartridge(fileText);
 * console.log(cartridge.title);
 * ```
 */
export function parseCartridge(text: string): TyntCartridgeV1 {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Cartridge is not valid JSON");
  }
  if (!isRecord(value) || value.format !== "tynt") {
    throw new Error("File is not a tynt cartridge");
  }
  rejectUnknownFields(
    value,
    ["format", "version", "title", "author", "description", "controls", "source", "canvas", "palette"],
    "cartridge",
  );
  if (value.version !== 1) {
    throw new Error("Unsupported cartridge version");
  }
  if (isRecord(value.canvas)) rejectUnknownFields(value.canvas, ["width", "height"], "canvas");
  if (!hasFixedCanvas(value.canvas)) {
    throw new Error("Cartridge canvas metadata must be 160 × 144");
  }
  if (isRecord(value.palette)) rejectUnknownFields(value.palette, ["model", "colors"], "palette");
  if (!hasFixedPalette(value.palette)) {
    throw new Error("Cartridge palette metadata is invalid");
  }
  const draft = validateCompleteDraft(value);
  return {
    format: "tynt",
    version: 1,
    ...draft,
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    palette: { model: "indexed", colors: [...PALETTE] },
  };
}

/**
 * Serializes a validated draft with fixed version 1 metadata.
 * @param draft - Editable cartridge fields. All fields must be complete for export.
 * @returns Pretty-printed JSON ending with a newline.
 * @throws If a required field is blank, invalid, or exceeds cartridge limits.
 */
export function serializeCartridge(draft: Draft): string {
  const valid = validateCompleteDraft(draft);
  const cartridge: TyntCartridgeV1 = {
    format: "tynt",
    version: 1,
    ...valid,
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    palette: { model: "indexed", colors: [...PALETTE] },
  };
  return `${JSON.stringify(cartridge, null, 2)}\n`;
}

/**
 * Converts a title into a lowercase `.tynt` download filename.
 * @param title - Cartridge title to normalize.
 * @returns A safe filename, or `untitled.tynt` when no safe characters remain.
 */
export function safeFilename(title: string): string {
  const safe = normalizeTitle(title)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${safe || "untitled"}.tynt`;
}
