import { createCartridgeLibrary, createMemoryAdapter } from "@/library/cartridge-library";
import { createIndexedDbAdapter } from "@/library/indexed-db";

const adapter = typeof indexedDB === "undefined" ? createMemoryAdapter() : createIndexedDbAdapter();

export const browserCartridgeLibrary = createCartridgeLibrary(adapter);
