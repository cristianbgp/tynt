import { describe, expect, test } from "vitest";
import { AUTOSAVE_KEY, createAutosaver, readAutosave, writeAutosave, type StorageLike } from "../src/autosave";

const VALID_SOURCE = "export function init(){}\nexport function update(){}\nexport function draw(){}";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { values: Map<string, string> } {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

describe("autosave", () => {
  test("restores a valid versioned draft", () => {
    const storage = memoryStorage({ [AUTOSAVE_KEY]: JSON.stringify({ version: 1, title: "demo", source: VALID_SOURCE }) });
    expect(readAutosave(storage)).toEqual({ title: "demo", source: VALID_SOURCE });
  });

  test.each([
    "{",
    JSON.stringify({ version: 2, title: "x", source: VALID_SOURCE }),
    JSON.stringify({ version: 1, title: "x", source: "x".repeat(262_145) }),
  ])("discards invalid autosave", (saved) => {
    const storage = memoryStorage({ [AUTOSAVE_KEY]: saved });
    expect(readAutosave(storage)).toBeNull();
    expect(storage.getItem(AUTOSAVE_KEY)).toBeNull();
  });

  test("writes normalized versioned drafts", () => {
    const storage = memoryStorage();
    writeAutosave(storage, { title: "  ", source: VALID_SOURCE });
    expect(JSON.parse(storage.getItem(AUTOSAVE_KEY)!)).toEqual({ version: 1, title: "untitled", source: VALID_SOURCE });
  });

  test("debounces writes and flushes the latest draft", async () => {
    const storage = memoryStorage();
    const autosaver = createAutosaver(storage, 5);
    autosaver.schedule({ title: "old", source: VALID_SOURCE });
    autosaver.schedule({ title: "new", source: `${VALID_SOURCE}\n// new` });
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(readAutosave(storage)?.title).toBe("new");
    autosaver.cancel();
  });

  test("reports when a draft has been saved", async () => {
    const storage = memoryStorage();
    let saves = 0;
    const autosaver = createAutosaver(storage, 5, () => {}, () => saves++);
    autosaver.schedule({ title: "demo", source: VALID_SOURCE });
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(saves).toBe(1);
  });
});
