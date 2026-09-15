import type { InputName } from "@tynt/core";

export interface RuntimeDebugState {
  frame: number;
  held: readonly InputName[];
  pressed: readonly InputName[];
}

export interface RuntimeDebugStore {
  getSnapshot(): RuntimeDebugState;
  subscribe(listener: () => void): () => void;
  update(state: RuntimeDebugState): void;
}

export function createRuntimeDebugStore(): RuntimeDebugStore {
  let snapshot: RuntimeDebugState = { frame: 0, held: [], pressed: [] };
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update: (state) => {
      snapshot = state;
      for (const listener of listeners) listener();
    },
  };
}
