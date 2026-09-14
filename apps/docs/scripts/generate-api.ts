import { mkdir } from "node:fs/promises";
import { CARTRIDGE_API, type CartridgeApiCategory } from "@tynt/core";

const outputUrl = new URL("../content/docs/reference/cartridge-api.mdx", import.meta.url);
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
  return ["---", "title: Cartridge API", "description: The complete API available to every cartridge.", "---", "", "# Cartridge API", "",
    "The complete API available to every cartridge. Functions are deterministic unless noted.", "", ...sections].join("\n");
}

export async function writeApiDocument(): Promise<void> {
  await mkdir(new URL("../content/docs/reference/", import.meta.url), { recursive: true });
  await Bun.write(outputUrl, generateApiDocument());
}

export async function checkApiDocument(): Promise<boolean> {
  const file = Bun.file(outputUrl);
  return file.exists().then(async (exists) => exists && await file.text() === generateApiDocument());
}

if (import.meta.main) {
  if (Bun.argv.includes("--check")) {
    if (!await checkApiDocument()) {
      console.error("[error] generated cartridge API reference is stale");
      process.exitCode = 1;
    } else {
      console.info("[info] cartridge API reference is current");
    }
  } else {
    await writeApiDocument();
    console.info("[info] generated creator API reference");
  }
}
