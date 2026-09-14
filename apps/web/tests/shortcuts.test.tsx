// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { useAppShortcuts } from "@/hooks/use-app-shortcuts";

function Harness({
  onRun,
  onImport,
  onExport,
  disabled = false,
}: {
  onRun(): void;
  onImport(): void;
  onExport(): void;
  disabled?: boolean;
}) {
  const [runDisabled] = useState(disabled);
  useAppShortcuts({ onRun, onImport, onExport, runDisabled });
  return null;
}

function press(key: string, modifiers: KeyboardEventInit, target: EventTarget = document): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, cancelable: true, bubbles: true, ...modifiers });
  target.dispatchEvent(event);
  return event;
}

describe("application shortcuts", () => {
  test("runs application actions and prevents only handled browser defaults", () => {
    const onRun = vi.fn();
    const onImport = vi.fn();
    const onExport = vi.fn();
    render(<Harness onRun={onRun} onImport={onImport} onExport={onExport} />);

    expect(press("Enter", { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(press("Enter", { metaKey: true }).defaultPrevented).toBe(false);
    expect(press("Enter", { ctrlKey: true, shiftKey: true }).defaultPrevented).toBe(true);
    expect(press("Enter", { metaKey: true, shiftKey: true }).defaultPrevented).toBe(false);
    expect(press("o", { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(press("S", { metaKey: true }).defaultPrevented).toBe(true);
    expect(press("p", { ctrlKey: true }).defaultPrevented).toBe(false);

    expect(onRun).toHaveBeenCalledOnce();
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  test("prevents run shortcuts before an editor handles the keydown", () => {
    const onRun = vi.fn();
    render(<Harness onRun={onRun} onImport={() => {}} onExport={() => {}} />);
    const editor = document.createElement("div");
    document.body.append(editor);
    let editorSawPrevented = false;
    editor.addEventListener("keydown", (event) => {
      editorSawPrevented = event.defaultPrevented;
    });

    press("Enter", { ctrlKey: true, shiftKey: true }, editor);

    expect(editorSawPrevented).toBe(true);
    expect(onRun).toHaveBeenCalledOnce();
    editor.remove();
  });

  test("runs from the physical Enter code when the browser key value is unidentified", () => {
    const onRun = vi.fn();
    render(<Harness onRun={onRun} onImport={() => {}} onExport={() => {}} />);

    const event = press("Unidentified", { code: "Enter", ctrlKey: true, shiftKey: true });

    expect(event.defaultPrevented).toBe(true);
    expect(onRun).toHaveBeenCalledOnce();
  });

  test("leaves unshifted modified Enter available to the editor", () => {
    const onRun = vi.fn();
    render(<Harness onRun={onRun} onImport={() => {}} onExport={() => {}} />);
    const editor = document.createElement("div");
    document.body.append(editor);
    let editorSawPrevented = true;
    editor.addEventListener("keydown", (event) => {
      editorSawPrevented = event.defaultPrevented;
    });

    press("Enter", { metaKey: true }, editor);

    expect(editorSawPrevented).toBe(false);
    expect(onRun).not.toHaveBeenCalled();
    editor.remove();
  });

  test("does not run while compilation has disabled the action", () => {
    const onRun = vi.fn();
    render(<Harness onRun={onRun} onImport={() => {}} onExport={() => {}} disabled />);

    expect(press("Enter", { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(onRun).not.toHaveBeenCalled();
  });
});
