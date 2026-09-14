import { describe, expect, test } from "vitest";
import { getDocument, getDocumentNeighbors, getOrderedDocuments } from "@/lib/source";

describe("documentation source", () => {
  test("resolves repository documents through clean routes", () => {
    expect(getDocument()?.url).toBe("/docs");
    expect(getDocument(["getting-started"])?.data.title).toBe("Getting started");
    expect(getDocument(["missing"])).toBeUndefined();
  });

  test("keeps page order and neighboring links stable", () => {
    expect(getOrderedDocuments().map((page) => page.url)).toEqual([
      "/docs",
      "/docs/getting-started",
      "/docs/examples",
      "/docs/cartridge-files",
      "/docs/publishing",
      "/docs/security",
      "/docs/reference/cartridge-api",
    ]);
    expect(getDocumentNeighbors("/docs/examples")).toMatchObject({
      previous: { url: "/docs/getting-started" },
      next: { url: "/docs/cartridge-files" },
    });
  });
});
