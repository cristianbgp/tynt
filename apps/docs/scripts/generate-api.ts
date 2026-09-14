import { mkdir } from "node:fs/promises";
import { CARTRIDGE_API, type CartridgeApiCategory } from "@tynt/core";

const outputUrl = new URL("../generated/cartridge-api.md", import.meta.url);
const categories: readonly [CartridgeApiCategory, string][] = [
  ["lifecycle", "Lifecycle"], ["drawing", "Drawing"], ["input", "Input"],
  ["world", "World and camera"], ["deterministic", "Deterministic utilities"], ["audio", "Audio"],
];

export function generateApiDocument(): string {
  const sections = categories.flatMap(([category, title]) => [
    `## ${title}`, "",
    ...CARTRIDGE_API.filter((entry) => entry.category === category).flatMap((entry) => [
      `### \`${entry.name}\``, "", `\`${entry.signature}\``, "", entry.description, "",
    ]),
  ]);
  return ["---", "title: Cartridge API", "group: Creator guide", "---", "", "# Cartridge API", "",
    "The complete API available to every cartridge. Functions are deterministic unless noted.", "", ...sections].join("\n");
}

export async function writeApiDocument(): Promise<void> {
  await mkdir(new URL("../generated/", import.meta.url), { recursive: true });
  await Bun.write(outputUrl, generateApiDocument());
}

if (import.meta.main) {
  await writeApiDocument();
  console.info("[info] generated creator API reference");
}
