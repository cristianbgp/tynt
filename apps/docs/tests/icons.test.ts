import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { metadata } from "../app/layout";

const publicRoot = resolve(process.cwd(), "public");

async function readPngSize(name: string) {
  const png = await readFile(resolve(publicRoot, name));

  expect(png.subarray(1, 4).toString()).toBe("PNG");
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

describe("documentation icons", () => {
  test("publishes vector and raster icons for browsers and Apple devices", async () => {
    expect(metadata.icons).toEqual({
      icon: [
        { url: "/tynt-mark.svg", type: "image/svg+xml", sizes: "any" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      ],
      apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
    });

    await expect(readPngSize("favicon-32x32.png")).resolves.toEqual({ width: 32, height: 32 });
    await expect(readPngSize("favicon-48x48.png")).resolves.toEqual({ width: 48, height: 48 });
    await expect(readPngSize("apple-touch-icon.png")).resolves.toEqual({
      width: 180,
      height: 180,
    });
  });
});
