import { validateDraft, type Draft } from "@tynt/core";

export interface LibraryCartridge extends Draft {
  id: string;
  formatVersion: 1;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export interface LibraryAdapter {
  list(): Promise<LibraryCartridge[]>;
  get(id: string): Promise<LibraryCartridge | undefined>;
  put(record: LibraryCartridge): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface SaveCartridgeInput {
  id?: string;
  draft: Draft;
  thumbnail?: string;
}

export interface CartridgeLibrary {
  list(): Promise<LibraryCartridge[]>;
  get(id: string): Promise<LibraryCartridge | undefined>;
  save(input: SaveCartridgeInput): Promise<LibraryCartridge>;
  duplicate(id: string): Promise<LibraryCartridge>;
  remove(id: string): Promise<void>;
}

interface LibraryDependencies {
  createId(): string;
  now(): string;
}

const defaultDependencies: LibraryDependencies = {
  createId: () => globalThis.crypto.randomUUID(),
  now: () => new Date().toISOString(),
};

function toDraft(record: LibraryCartridge): Draft {
  const { title, source, author, description, controls } = record;
  return {
    title,
    source,
    ...(author ? { author } : {}),
    ...(description ? { description } : {}),
    ...(controls ? { controls } : {}),
  };
}

export function createCartridgeLibrary(
  adapter: LibraryAdapter,
  dependencies: LibraryDependencies = defaultDependencies,
): CartridgeLibrary {
  const save = async ({ id, draft, thumbnail }: SaveCartridgeInput): Promise<LibraryCartridge> => {
    const validDraft = validateDraft(draft);
    const existing = id ? await adapter.get(id) : undefined;
    const timestamp = dependencies.now();
    const record: LibraryCartridge = {
      id: existing?.id ?? dependencies.createId(),
      formatVersion: 1,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      ...validDraft,
      ...((thumbnail ?? existing?.thumbnail)
        ? { thumbnail: thumbnail ?? existing?.thumbnail }
        : {}),
    };
    await adapter.put(record);
    return record;
  };

  return {
    async list() {
      return (await adapter.list()).sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );
    },
    get: (id) => adapter.get(id),
    save,
    async duplicate(id) {
      const original = await adapter.get(id);
      if (!original) throw new Error("Cartridge not found");
      return save({
        draft: { ...toDraft(original), title: `${original.title} copy` },
        thumbnail: original.thumbnail,
      });
    },
    remove: (id) => adapter.remove(id),
  };
}

export function createMemoryAdapter(): LibraryAdapter {
  const records = new Map<string, LibraryCartridge>();
  return {
    async list() {
      return [...records.values()];
    },
    async get(id) {
      return records.get(id);
    },
    async put(record) {
      records.set(record.id, record);
    },
    async remove(id) {
      records.delete(id);
    },
  };
}
