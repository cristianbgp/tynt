import { useEffect, useRef } from "react";
import { autocompletion } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { tyntCompletionSource } from "@/editor/tynt-api";
import { tyntSyntaxHighlighting } from "@/editor/tynt-highlighting";

interface EditorProps {
  source: string;
  onChange(source: string): void;
}

export function Editor({ source, onChange }: EditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) return;
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: source,
        extensions: [
          lineNumbers(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          javascript({ typescript: true }),
          tyntSyntaxHighlighting,
          autocompletion({ override: [tyntCompletionSource] }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.theme({
            "&": { height: "100%" },
            ".cm-scroller": { fontFamily: "inherit", overflow: "auto" },
            ".cm-gutters": { backgroundColor: "#fff", color: "#aaa", border: "none" },
            ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#f4f4f4" },
            "&.cm-focused": { outline: "none" },
            ".cm-cursor": { borderLeftColor: "#000" },
            ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "#d8d8d8" },
            ".cm-tooltip": { border: "1px solid #000", borderRadius: "0", boxShadow: "none", backgroundColor: "#fff" },
            ".cm-tooltip-autocomplete > ul": { fontFamily: "inherit" },
            ".cm-tooltip-autocomplete > ul > li": { padding: "3px 7px" },
            ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: "#000", color: "#fff" },
            ".cm-completionInfo": { border: "1px solid #000", borderRadius: "0", boxShadow: "none", padding: "7px" },
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === source) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: source } });
  }, [source]);

  return (
    <section className="editor-pane h-full min-h-0 overflow-hidden border-r border-border max-[760px]:border-r-0 max-[760px]:border-b" aria-label="TypeScript editor">
      <div className="h-full min-h-0" id="editor" ref={hostRef} />
    </section>
  );
}
