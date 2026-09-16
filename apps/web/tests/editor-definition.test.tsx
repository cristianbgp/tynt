// @vitest-environment jsdom

import { fireEvent, render } from "@testing-library/react";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, test, vi } from "vitest";
import { Editor } from "@/components/editor";
import { tyntDefinitionNavigation } from "@/editor/tynt-definitions";

describe("editor definition navigation", () => {
  test("F12 opens the exact documentation anchor for a built-in API function", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container } = render(<Editor source="rect(1, 2, 3, 4, 1);" onChange={() => {}} />);
    const content = container.querySelector<HTMLElement>(".cm-content")!;

    content.focus();
    fireEvent.keyDown(content, { key: "F12", code: "F12" });

    expect(open).toHaveBeenCalledWith(
      "https://docs.tynt.dev/docs/reference/cartridge-api#rect",
      "_blank",
      "noopener,noreferrer",
    );
    open.mockRestore();
  });

  test.each(["init", "update", "draw"])(
    "F12 on the exported %s declaration opens its API documentation",
    (name) => {
      const open = vi.spyOn(window, "open").mockImplementation(() => null);
      const source = `export function ${name}(): void {}`;
      const view = new EditorView({
        parent: document.body,
        state: EditorState.create({
          doc: source,
          selection: { anchor: source.indexOf(name) },
          extensions: [javascript({ typescript: true }), tyntDefinitionNavigation()],
        }),
      });

      view.contentDOM.dispatchEvent(
        new KeyboardEvent("keydown", { key: "F12", code: "F12", bubbles: true }),
      );

      const calls = [...open.mock.calls];
      view.destroy();
      open.mockRestore();
      expect(calls).toContainEqual([
        `https://docs.tynt.dev/docs/reference/cartridge-api#${name}`,
        "_blank",
        "noopener,noreferrer",
      ]);
    },
  );

  test("F12 moves from a local function call to its declaration", () => {
    const source = `function helper() { return 1; }

helper();`;
    const view = new EditorView({
      parent: document.body,
      state: EditorState.create({
        doc: source,
        selection: { anchor: source.lastIndexOf("helper") + "helper".length },
        extensions: [javascript({ typescript: true }), tyntDefinitionNavigation()],
      }),
    });

    view.contentDOM.dispatchEvent(
      new KeyboardEvent("keydown", { key: "F12", code: "F12", bubbles: true }),
    );

    expect(view.state.selection.main.head).toBe(source.indexOf("helper"));
    view.destroy();
  });

  test("F12 chooses the nearest visible declaration for a shadowed variable", () => {
    const source = `const speed = 1;
function update() {
  const speed = 2;
  return speed;
}`;
    const view = new EditorView({
      parent: document.body,
      state: EditorState.create({
        doc: source,
        selection: { anchor: source.lastIndexOf("speed") },
        extensions: [javascript({ typescript: true }), tyntDefinitionNavigation()],
      }),
    });

    view.contentDOM.dispatchEvent(
      new KeyboardEvent("keydown", { key: "F12", code: "F12", bubbles: true }),
    );

    expect(view.state.selection.main.head).toBe(
      source.indexOf("speed", source.indexOf("function")),
    );
    view.destroy();
  });
});
