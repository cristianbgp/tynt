import type { TyntCartridgeV1 } from "../../../packages/core/src/cartridge";

export const PUBLIC_TAGS = ["arcade", "puzzle", "platformer", "simulation", "tutorial", "two-button", "procedural"] as const;
export const PUBLIC_LICENSES = ["MIT"] as const;
export const MAX_COVER_BYTES = 256 * 1024;
export const MAX_DIRECTORY_BYTES = 768 * 1024;
export const ALLOWED_FILES = ["game.tynt", "cartridge.json", "cover.png", "README.md"] as const;

export type PublicTag = (typeof PUBLIC_TAGS)[number];
export type PublicLicense = (typeof PUBLIC_LICENSES)[number];

export interface PublishingMetadata {
  version: 1;
  tags: PublicTag[];
  license: PublicLicense;
  repository?: string;
}

export interface GeneratedCartridge extends PublishingMetadata {
  slug: string;
  filename: `${string}.tynt`;
  title: string;
  author: string;
  description: string;
  controls: string;
  source: string;
  coverUrl: string;
  cartridge: TyntCartridgeV1;
}

export interface GenerateOptions {
  cartridgesDir: string;
  outputFile: string;
  coverOutputDir: string;
  check?: boolean;
}
