import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { encode } from "fast-png";
import { serializeCartridge } from "../../../packages/core/src/cartridge";
import { generatePublicCartridges } from "../generate";
import { readPngDimensions } from "../validate";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function png(width = 320, height = 288): Promise<Uint8Array> {
  return encode({
    width,
    height,
    data: new Uint8Array(width * height * 4),
    channels: 4,
    depth: 8,
  });
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function withTextChunk(source: Uint8Array): Uint8Array {
  const type = new TextEncoder().encode("tEXt");
  const data = new TextEncoder().encode("Comment\0untrusted metadata");
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(type, 4);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  const iendOffset = source.length - 12;
  const result = new Uint8Array(source.length + chunk.length);
  result.set(source.subarray(0, iendOffset));
  result.set(chunk, iendOffset);
  result.set(source.subarray(iendOffset), iendOffset + chunk.length);
  return result;
}

function hasChunk(source: Uint8Array, wanted: string): boolean {
  let offset = 8;
  while (offset + 12 <= source.length) {
    const view = new DataView(
      source.buffer,
      source.byteOffset + offset,
      source.length - offset,
    );
    const length = view.getUint32(0);
    const type = new TextDecoder().decode(
      source.subarray(offset + 4, offset + 8),
    );
    if (type === wanted) return true;
    offset += 12 + length;
  }
  return false;
}

async function fixture(): Promise<{
  root: string;
  cartridgesDir: string;
  outputFile: string;
  coverOutputDir: string;
}> {
  const root = await mkdtemp(join(tmpdir(), "tynt-cartridges-"));
  roots.push(root);
  return {
    root,
    cartridgesDir: join(root, "cartridges"),
    outputFile: join(root, "generated", "public-cartridges.ts"),
    coverOutputDir: join(root, "public", "covers"),
  };
}

async function addCartridge(
  root: string,
  slug: string,
  source = "export function init(){} export function update(){} export function draw(){}",
): Promise<void> {
  const directory = join(root, slug);
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, "game.tynt"),
    serializeCartridge({
      title: slug,
      author: "maker",
      description: `Play ${slug}`,
      controls: "A acts",
      source,
    }),
  );
  await writeFile(
    join(directory, "cartridge.json"),
    JSON.stringify({
      version: 1,
      publishedAt: "2026-09-14",
      tags: ["arcade"],
      license: "MIT",
    }),
  );
  await writeFile(join(directory, "cover.png"), await png());
}

describe("public cartridge generation", () => {
  test("generates a stable catalog and normalized covers in slug order", async () => {
    const paths = await fixture();
    await addCartridge(paths.cartridgesDir, "zebra");
    await addCartridge(paths.cartridgesDir, "alpha");
    const result = await generatePublicCartridges(paths);

    expect(result.map(({ slug }) => slug)).toEqual(["alpha", "zebra"]);
    const output = await readFile(paths.outputFile, "utf8");
    expect(output).toContain("export const PUBLIC_CARTRIDGES");
    expect(output).toContain("publishedAt: string");
    expect(output).toContain('"publishedAt": "2026-09-14"');
    expect(output.indexOf('"slug": "alpha"')).toBeLessThan(
      output.indexOf('"slug": "zebra"'),
    );
    const publishedCover = new Uint8Array(
      await readFile(join(paths.coverOutputDir, "alpha.png")),
    );
    expect(readPngDimensions(publishedCover)).toEqual({
      width: 320,
      height: 288,
    });
  });

  test("includes README content when present and omits it when absent", async () => {
    const paths = await fixture();
    await addCartridge(paths.cartridgesDir, "documented");
    await addCartridge(paths.cartridgesDir, "minimal");
    await writeFile(
      join(paths.cartridgesDir, "documented", "README.md"),
      "# How to play\n\nPress **A**.",
    );

    const result = await generatePublicCartridges(paths);

    expect(result.find(({ slug }) => slug === "documented")?.readme).toBe(
      "# How to play\n\nPress **A**.",
    );
    expect(
      result.find(({ slug }) => slug === "minimal")?.readme,
    ).toBeUndefined();
    expect(await readFile(paths.outputFile, "utf8")).toContain(
      '"readme": "# How to play\\n\\nPress **A**."',
    );
  });

  test("reports every invalid cartridge without replacing existing output", async () => {
    const paths = await fixture();
    await mkdir(paths.cartridgesDir, { recursive: true });
    await addCartridge(
      paths.cartridgesDir,
      "bad-life",
      "export function init(){}",
    );
    await addCartridge(paths.cartridgesDir, "bad-cover");
    await writeFile(
      join(paths.cartridgesDir, "bad-cover", "cover.png"),
      await png(12, 12),
    );
    await mkdir(join(paths.root, "generated"), { recursive: true });
    await writeFile(paths.outputFile, "keep me");

    await expect(generatePublicCartridges(paths)).rejects.toThrow(
      /bad-cover[\s\S]*320 × 288[\s\S]*bad-life[\s\S]*update/,
    );
    expect(await readFile(paths.outputFile, "utf8")).toBe("keep me");
  });

  test("decodes covers and strips untrusted ancillary chunks from published output", async () => {
    const paths = await fixture();
    await addCartridge(paths.cartridgesDir, "alpha");
    const coverPath = join(paths.cartridgesDir, "alpha", "cover.png");
    await writeFile(coverPath, withTextChunk(await png()));

    await generatePublicCartridges(paths);

    const published = new Uint8Array(
      await readFile(join(paths.coverOutputDir, "alpha.png")),
    );
    expect(hasChunk(published, "tEXt")).toBe(false);
    expect(published).not.toEqual(new Uint8Array(await readFile(coverPath)));
  });

  test("rejects a truncated cover that only has a valid PNG header", async () => {
    const paths = await fixture();
    await addCartridge(paths.cartridgesDir, "broken");
    const headerOnly = (await png()).subarray(0, 24);
    await writeFile(
      join(paths.cartridgesDir, "broken", "cover.png"),
      headerOnly,
    );

    await expect(generatePublicCartridges(paths)).rejects.toThrow(
      /broken[\s\S]*(decode|PNG|png)/,
    );
  });

  test("rejects legacy one-times cover dimensions", async () => {
    const paths = await fixture();
    await addCartridge(paths.cartridgesDir, "legacy-cover");
    await writeFile(
      join(paths.cartridgesDir, "legacy-cover", "cover.png"),
      await png(160, 144),
    );

    await expect(generatePublicCartridges(paths)).rejects.toThrow(
      /legacy-cover[\s\S]*320 × 288/,
    );
  });

  test("check mode validates a clean clone without requiring generated output", async () => {
    const paths = await fixture();
    await addCartridge(paths.cartridgesDir, "alpha");

    const result = await generatePublicCartridges({ ...paths, check: true });

    expect(result.map(({ slug }) => slug)).toEqual(["alpha"]);
    expect(await Bun.file(paths.outputFile).exists()).toBe(false);
  });

  test("removes generated covers for cartridges that no longer exist", async () => {
    const paths = await fixture();
    await addCartridge(paths.cartridgesDir, "coin-dash");
    await mkdir(paths.coverOutputDir, { recursive: true });
    const staleCover = join(paths.coverOutputDir, "toolkit.png");
    await writeFile(staleCover, await png());

    await generatePublicCartridges(paths);

    expect(await Bun.file(staleCover).exists()).toBe(false);
    expect(
      await Bun.file(join(paths.coverOutputDir, "coin-dash.png")).exists(),
    ).toBe(true);
  });
});
