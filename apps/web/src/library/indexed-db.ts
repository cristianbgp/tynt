import type { LibraryAdapter, LibraryCartridge } from "@/library/cartridge-library";

const DATABASE_NAME = "tynt";
const STORE_NAME = "cartridges";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local library request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Local library transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Local library transaction was cancelled"));
  });
}

export function createIndexedDbAdapter(factory: IDBFactory = indexedDB): LibraryAdapter {
  const database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open the local cartridge library"));
  });

  return {
    async list() {
      const db = await database;
      return requestResult(db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll()) as Promise<
        LibraryCartridge[]
      >;
    },
    async get(id) {
      const db = await database;
      return requestResult(db.transaction(STORE_NAME).objectStore(STORE_NAME).get(id)) as Promise<
        LibraryCartridge | undefined
      >;
    },
    async put(record) {
      const db = await database;
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(record);
      await transactionDone(transaction);
    },
    async remove(id) {
      const db = await database;
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      await transactionDone(transaction);
    },
  };
}
