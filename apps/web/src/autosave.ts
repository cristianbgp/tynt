import { normalizeTitle, validateDraft, type Draft } from "@tynt/core";

export const AUTOSAVE_KEY = "tynt:draft:v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function readAutosave(storage: StorageLike): Draft | null {
  try {
    const saved = storage.getItem(AUTOSAVE_KEY);
    if (saved === null) return null;
    const value: unknown = JSON.parse(saved);
    if (typeof value !== "object" || value === null || (value as Record<string, unknown>).version !== 1) {
      throw new Error("Incompatible autosave");
    }
    return validateDraft(value);
  } catch {
    try {
      storage.removeItem(AUTOSAVE_KEY);
    } catch {
      // Storage can be unavailable; recovery still falls back to the example.
    }
    return null;
  }
}

export function writeAutosave(storage: StorageLike, draft: Draft): void {
  const valid = validateDraft({ ...draft, title: normalizeTitle(draft.title) });
  storage.setItem(AUTOSAVE_KEY, JSON.stringify({ version: 1, ...valid }));
}

export function createAutosaver(
  storage: StorageLike,
  delayMs = 250,
  onError: (error: unknown) => void = () => {},
  onSaved: () => void = () => {},
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    schedule(draft: Draft) {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        try {
          writeAutosave(storage, draft);
          onSaved();
        } catch (error) {
          onError(error);
        }
      }, delayMs);
    },
    cancel() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}
