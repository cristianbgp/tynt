import type { Draft } from "@tynt/core";
import { PUBLIC_CARTRIDGES, type PublicCartridge } from "@/generated/public-cartridges";

export type { PublicCartridge } from "@/generated/public-cartridges";

export function listPublicCartridges(): readonly PublicCartridge[] {
  return PUBLIC_CARTRIDGES;
}

export function findPublicCartridge(slug: string): PublicCartridge | undefined {
  return PUBLIC_CARTRIDGES.find((cartridge) => cartridge.slug === slug);
}

export function copyPublicDraft(cartridge: PublicCartridge): Draft {
  return {
    title: cartridge.title,
    source: cartridge.source,
    author: cartridge.author,
    description: cartridge.description,
    controls: cartridge.controls,
  };
}
