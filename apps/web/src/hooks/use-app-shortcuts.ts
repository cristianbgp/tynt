import { useEffect, useRef } from "react";
import { matchesShortcut } from "@/lib/shortcuts";

interface ShortcutActions {
  onRun(): void;
  onImport(): void;
  onExport(): void;
  runDisabled?: boolean;
}

export function useAppShortcuts(actions: ShortcutActions): void {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesShortcut(event, { key: "Enter", code: "Enter", modifier: "control", shift: true })) {
        if (actionsRef.current.runDisabled) return;
        event.preventDefault();
        actionsRef.current.onRun();
      } else if (matchesShortcut(event, { key: "o", code: "KeyO", modifier: "primary" })) {
        event.preventDefault();
        actionsRef.current.onImport();
      } else if (matchesShortcut(event, { key: "s", code: "KeyS", modifier: "primary" })) {
        event.preventDefault();
        actionsRef.current.onExport();
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);
}
