export interface Shortcut {
  key: string;
  code?: string;
  modifier?: "control" | "primary";
  shift?: boolean;
}

export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
    || (shortcut.code !== undefined && event.code === shortcut.code);
  const modifierMatches = shortcut.modifier === "control"
    ? event.ctrlKey && !event.metaKey
    : shortcut.modifier === "primary"
      ? event.ctrlKey || event.metaKey
      : !event.ctrlKey && !event.metaKey;

  return keyMatches
    && modifierMatches
    && event.shiftKey === Boolean(shortcut.shift)
    && !event.altKey;
}
