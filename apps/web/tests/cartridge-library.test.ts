import { describe, expect, test } from "vitest";
import {
  createCartridgeLibrary,
  type LibraryAdapter,
  type LibraryCartridge,
} from "@/library/cartridge-library";

function memoryAdapter(): LibraryAdapter {
  const records = new Map<string, LibraryCartridge>();
  return {
    list: async () => [...records.values()],
    get: async (id) => records.get(id),
    put: async (record) => { records.set(record.id, structuredClone(record)); },
    remove: async (id) => { records.delete(id); },
  };
}

function dependencies() {
  let id = 0;
  let time = 0;
  return {
    createId: () => `cartridge-${++id}`,
    now: () => new Date(Date.UTC(2026, 8, 14, 0, 0, ++time)).toISOString(),
  };
}

const source = "export function init(){} export function update(){} export function draw(){}";

describe("local cartridge library", () => {
  test("creates, updates, and lists records most recently updated first", async () => {
    const library = createCartridgeLibrary(memoryAdapter(), dependencies());
    const first = await library.save({ draft: { title: "first", source } });
    const second = await library.save({ draft: { title: "second", source, author: "me" }, thumbnail: "data:image/png;base64,AA==" });
    const updated = await library.save({ id: first.id, draft: { title: "first renamed", source } });

    expect(updated.id).toBe(first.id);
    expect(updated.createdAt).toBe(first.createdAt);
    expect(updated.updatedAt).not.toBe(first.updatedAt);
    expect((await library.list()).map((record) => record.title)).toEqual(["first renamed", "second"]);
    expect(second).toMatchObject({ formatVersion: 1, author: "me", thumbnail: "data:image/png;base64,AA==" });
  });

  test("duplicates an existing record as an independent recent copy", async () => {
    const library = createCartridgeLibrary(memoryAdapter(), dependencies());
    const original = await library.save({ draft: { title: "orbit", source, description: "small" } });
    const copy = await library.duplicate(original.id);

    expect(copy).toMatchObject({ title: "orbit copy", source, description: "small" });
    expect(copy.id).not.toBe(original.id);
    expect(copy.createdAt).toBe(copy.updatedAt);
    expect((await library.list()).map((record) => record.id)).toEqual([copy.id, original.id]);
  });

  test("returns undefined for missing records and removes saved records", async () => {
    const library = createCartridgeLibrary(memoryAdapter(), dependencies());
    expect(await library.get("missing")).toBeUndefined();
    await expect(library.duplicate("missing")).rejects.toThrow(/not found/i);
    const record = await library.save({ draft: { title: "temporary", source } });
    await library.remove(record.id);
    expect(await library.list()).toEqual([]);
  });
});
