import { expect, test, vi } from "vitest";
import { createRuntimeDebugStore } from "@/runtime/debug-store";

test("publishes runtime telemetry without requiring an application render", () => {
  const store = createRuntimeDebugStore();
  const listener = vi.fn();
  const unsubscribe = store.subscribe(listener);

  store.update({ frame: 9, held: ["right"], pressed: ["a"] });

  expect(listener).toHaveBeenCalledOnce();
  expect(store.getSnapshot()).toEqual({ frame: 9, held: ["right"], pressed: ["a"] });
  unsubscribe();
  store.update({ frame: 10, held: [], pressed: [] });
  expect(listener).toHaveBeenCalledOnce();
});
