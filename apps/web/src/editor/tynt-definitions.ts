import { syntaxTree } from "@codemirror/language";
import { StateEffect, StateField, type Extension } from "@codemirror/state";
import { Decoration, EditorView, keymap, ViewPlugin, type DecorationSet } from "@codemirror/view";
import { CARTRIDGE_API } from "@tynt/core";

const DOCUMENTATION_URL = "https://docs.tynt.dev/docs/reference/cartridge-api";
const API_NAMES = new Set<string>(CARTRIDGE_API.map(({ name }) => name));
const LIFECYCLE_NAMES = new Set<string>(
  CARTRIDGE_API.filter(({ category }) => category === "lifecycle").map(({ name }) => name),
);
const IDENTIFIER_NODES = new Set(["VariableName", "VariableDefinition", "TypeName", "TypeDefinition"]);
const showDefinitionTarget = StateEffect.define<number | null>();
const definitionTargetTimers = new WeakMap<EditorView, number>();

const definitionTargetField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(targets, transaction) {
    let next = targets.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (!effect.is(showDefinitionTarget)) continue;
      next = effect.value === null
        ? Decoration.none
        : Decoration.set([
            Decoration.line({ class: "cm-definition-target" }).range(transaction.state.doc.lineAt(effect.value).from),
          ]);
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

interface Identifier {
  name: string;
  from: number;
  node: TreeNode;
}

interface TreeNode {
  readonly name: string;
  readonly from: number;
  readonly to: number;
  readonly parent: TreeNode | null;
}

interface DefinitionCandidate {
  from: number;
  scopeFrom: number;
  scopeTo: number;
}

const FUNCTION_NODES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunction"]);
const SCOPE_NODES = new Set(["Script", "Block", ...FUNCTION_NODES]);

function identifierAt(view: EditorView, position = view.state.selection.main.head): Identifier | null {
  const tree = syntaxTree(view.state);
  for (const side of [1, -1] as const) {
    const node = tree.resolveInner(position, side);
    if (IDENTIFIER_NODES.has(node.name)) {
      return {
        name: view.state.doc.sliceString(node.from, node.to),
        from: node.from,
        node: node as TreeNode,
      };
    }
  }
  return null;
}

function nearestAncestor(node: TreeNode | null, names: ReadonlySet<string>): TreeNode | null {
  for (let current = node; current; current = current.parent) {
    if (names.has(current.name)) return current;
  }
  return null;
}

function definitionScope(node: TreeNode): TreeNode | null {
  const parameterList = nearestAncestor(node.parent, new Set(["ParamList"]));
  if (parameterList) return nearestAncestor(parameterList.parent, FUNCTION_NODES);
  if (node.parent && FUNCTION_NODES.has(node.parent.name)) {
    return nearestAncestor(node.parent.parent, SCOPE_NODES);
  }
  return nearestAncestor(node.parent, SCOPE_NODES);
}

function localDefinition(view: EditorView, identifier: Identifier): number | null {
  const tree = syntaxTree(view.state);
  const candidates: DefinitionCandidate[] = [];
  tree.iterate({
    enter(node) {
      if (node.name !== "VariableDefinition" && node.name !== "TypeDefinition") return;
      if (view.state.doc.sliceString(node.from, node.to) !== identifier.name) return;
      const scope = definitionScope(tree.resolveInner(node.from, 1) as TreeNode);
      if (!scope || identifier.from < scope.from || identifier.from > scope.to) return;
      candidates.push({ from: node.from, scopeFrom: scope.from, scopeTo: scope.to });
    },
  });
  candidates.sort((left, right) => {
    const scopeDifference = (left.scopeTo - left.scopeFrom) - (right.scopeTo - right.scopeFrom);
    if (scopeDifference !== 0) return scopeDifference;
    const leftDistance = left.from <= identifier.from ? identifier.from - left.from : Number.MAX_SAFE_INTEGER;
    const rightDistance = right.from <= identifier.from ? identifier.from - right.from : Number.MAX_SAFE_INTEGER;
    return leftDistance - rightDistance;
  });
  return candidates[0]?.from ?? null;
}

function isNavigable(view: EditorView, identifier: Identifier): boolean {
  return localDefinition(view, identifier) !== null || API_NAMES.has(identifier.name);
}

function isExportedLifecycleDeclaration(identifier: Identifier): boolean {
  return LIFECYCLE_NAMES.has(identifier.name)
    && identifier.node.name === "VariableDefinition"
    && identifier.node.parent?.name === "FunctionDeclaration"
    && identifier.node.parent.parent?.name === "ExportDeclaration";
}

function documentationTarget(view: EditorView, identifier: Identifier): string | null {
  if (isExportedLifecycleDeclaration(identifier)) return identifier.name;
  return localDefinition(view, identifier) === null && API_NAMES.has(identifier.name)
    ? identifier.name
    : null;
}

function openDocumentation(name: string): void {
  window.open(`${DOCUMENTATION_URL}#${name}`, "_blank", "noopener,noreferrer");
}

function jumpToDefinition(view: EditorView, position?: number): boolean {
  const identifier = identifierAt(view, position);
  if (!identifier) return false;
  const documentationName = documentationTarget(view, identifier);
  if (documentationName) {
    openDocumentation(documentationName);
    return true;
  }
  const definition = localDefinition(view, identifier);
  if (definition !== null) {
    view.dispatch({
      selection: { anchor: definition },
      effects: [
        EditorView.scrollIntoView(definition, { y: "center" }),
        showDefinitionTarget.of(definition),
      ],
    });
    const currentTimer = definitionTargetTimers.get(view);
    if (currentTimer !== undefined) window.clearTimeout(currentTimer);
    definitionTargetTimers.set(view, window.setTimeout(() => {
      view.dispatch({ effects: showDefinitionTarget.of(null) });
      definitionTargetTimers.delete(view);
    }, 700));
    view.focus();
    return true;
  }
  return false;
}

export function tyntDefinitionNavigation(): Extension {
  let hoveredElement: Element | null = null;
  const clearHover = () => {
    hoveredElement?.classList.remove("cm-definition-link");
    hoveredElement = null;
  };

  return [
    definitionTargetField,
    keymap.of([{ key: "F12", run: jumpToDefinition }]),
    EditorView.domEventHandlers({
      mousedown(event, view) {
        if (event.button !== 0 || (!event.metaKey && !event.ctrlKey)) return false;
        const position = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (position === null) return false;
        const identifier = identifierAt(view, position);
        if (!identifier || !isNavigable(view, identifier)) return false;
        event.preventDefault();
        const documentationName = documentationTarget(view, identifier);
        if (documentationName) {
          openDocumentation(documentationName);
          return true;
        }
        window.setTimeout(() => jumpToDefinition(view, position), 0);
        return true;
      },
      mousemove(event, view) {
        if (!event.metaKey && !event.ctrlKey) {
          clearHover();
          return false;
        }
        const position = view.posAtCoords({ x: event.clientX, y: event.clientY });
        const identifier = position === null ? null : identifierAt(view, position);
        const target = event.target instanceof Element ? event.target : null;
        if (!identifier || !target || !isNavigable(view, identifier)) {
          clearHover();
          return false;
        }
        if (target !== hoveredElement) {
          clearHover();
          target.classList.add("cm-definition-link");
          hoveredElement = target;
        }
        return false;
      },
      mouseleave() {
        clearHover();
        return false;
      },
      keyup(event) {
        if (event.key === "Control" || event.key === "Meta") clearHover();
        return false;
      },
    }),
    EditorView.theme({
      ".cm-definition-link": { cursor: "pointer", textDecoration: "underline" },
      ".cm-definition-target": { backgroundColor: "#e8e8e8" },
    }),
    ViewPlugin.fromClass(class {
      private readonly handleKeyUp = (event: KeyboardEvent) => {
        if (event.key === "Control" || event.key === "Meta") clearHover();
      };

      constructor(private readonly view: EditorView) {
        window.addEventListener("keyup", this.handleKeyUp);
      }

      destroy() {
        window.removeEventListener("keyup", this.handleKeyUp);
        const timer = definitionTargetTimers.get(this.view);
        if (timer !== undefined) window.clearTimeout(timer);
        definitionTargetTimers.delete(this.view);
        clearHover();
      }
    }),
  ];
}
