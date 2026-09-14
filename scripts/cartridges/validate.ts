import {
  ALLOWED_FILES,
  PUBLIC_LICENSES,
  PUBLIC_TAGS,
  type PublishingMetadata,
  type PublicLicense,
  type PublicTag,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateSlug(value: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error("Cartridge slug must use lowercase letters, numbers, and single hyphens");
  }
  return value;
}

export function parsePublishingMetadata(text: string): PublishingMetadata {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Publishing metadata is not valid JSON");
  }
  if (!isRecord(value)) throw new Error("Publishing metadata must be an object");
  const allowed = new Set(["version", "tags", "license", "repository"]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`Unknown publishing field: ${key}`);
  }
  if (value.version !== 1) throw new Error("Unsupported publishing metadata version");
  if (!Array.isArray(value.tags) || value.tags.length === 0 || !value.tags.every((tag) => typeof tag === "string")) {
    throw new Error("Publishing tags must be a non-empty string array");
  }
  const tags = value.tags as string[];
  if (new Set(tags).size !== tags.length) throw new Error("Publishing tags cannot contain duplicate values");
  for (const tag of tags) {
    if (!(PUBLIC_TAGS as readonly string[]).includes(tag)) throw new Error(`Unsupported tag: ${tag}`);
  }
  if (typeof value.license !== "string" || !(PUBLIC_LICENSES as readonly string[]).includes(value.license)) {
    throw new Error(`Unsupported license: ${String(value.license)}`);
  }
  if (value.repository !== undefined) {
    if (typeof value.repository !== "string" || !value.repository.startsWith("https://")) {
      throw new Error("Publishing repository must be an HTTPS URL");
    }
    try {
      new URL(value.repository);
    } catch {
      throw new Error("Publishing repository must be a valid HTTPS URL");
    }
  }
  return {
    version: 1,
    tags: tags as PublicTag[],
    license: value.license as PublicLicense,
    ...(value.repository ? { repository: value.repository } : {}),
  };
}

export function readPngDimensions(bytes: Uint8Array): { width: number; height: number } {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82];
  if (bytes.byteLength < 24 || signature.some((byte, index) => bytes[index] !== byte)) {
    throw new Error("Cover is not a valid PNG");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

export function validateDirectoryEntries(entries: string[]): string[] {
  const allowed = new Set<string>(ALLOWED_FILES);
  return entries.filter((entry) => !allowed.has(entry)).sort().map((entry) => `Unexpected cartridge entry: ${entry}`);
}
