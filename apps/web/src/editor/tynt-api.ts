import { snippetCompletion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { CARTRIDGE_API } from "@tynt/core";

export interface TyntApiCompletion {
  label: string;
  signature: string;
  description: string;
  snippet: string;
}

export const TYNT_API_COMPLETIONS: readonly TyntApiCompletion[] = CARTRIDGE_API.map(
  ({ name, signature, description, snippet }) => ({ label: name, signature, description, snippet }),
);

const options = TYNT_API_COMPLETIONS.map(({ label, signature, description, snippet }) => snippetCompletion(
  snippet,
  { label, detail: signature, info: description, type: "function" },
));

export function tyntCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return { from: word.from, options, validFor: /^\w*$/ };
}
