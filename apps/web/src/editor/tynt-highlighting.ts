import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const tyntHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier], color: "#000000", fontWeight: "650" },
  { tag: [tags.string, tags.typeName], color: "#555555" },
  { tag: [tags.number, tags.bool, tags.null], color: "#333333", fontWeight: "600" },
  { tag: [tags.function(tags.variableName), tags.definition(tags.function(tags.variableName))], color: "#111111" },
  { tag: [tags.comment, tags.docComment], color: "#888888", fontStyle: "italic" },
  { tag: [tags.operator, tags.punctuation], color: "#666666" },
]);

export const tyntSyntaxHighlighting = syntaxHighlighting(tyntHighlightStyle);
