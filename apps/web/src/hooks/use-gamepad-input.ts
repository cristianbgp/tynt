import { useEffect, useRef, useState } from "react";
import { INPUT_NAMES, type InputName } from "@tynt/core";
import { readGamepadInput } from "@/runtime/gamepad-input";

/** Polls one standard gamepad while this game surface is mounted. */
export function useGamepadInput(onInput: (input: InputName, down: boolean) => void): boolean {
  const onInputRef = useRef(onInput);
  const [connected, setConnected] = useState(false);
  onInputRef.current = onInput;

  useEffect(() => {
    if (typeof navigator.getGamepads !== "function") return;
    let frame = 0;
    let held: ReadonlySet<InputName> = new Set();
    let isConnected = false;

    const apply = (next: ReadonlySet<InputName> | null, updateStatus = true) => {
      const nextHeld = next ?? new Set<InputName>();
      for (const input of INPUT_NAMES) {
        // Re-send held inputs after a cartridge restart resets the runtime's input state.
        if (next !== null || held.has(input)) onInputRef.current(input, nextHeld.has(input));
      }
      held = nextHeld;
      if (updateStatus && isConnected !== (next !== null)) {
        isConnected = next !== null;
        setConnected(isConnected);
      }
    };
    const poll = () => {
      apply(
        document.visibilityState === "hidden" ? null : readGamepadInput(navigator.getGamepads()),
      );
      frame = requestAnimationFrame(poll);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") apply(null);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    frame = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      apply(null, false);
    };
  }, []);

  return connected;
}
