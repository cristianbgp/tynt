function withoutCommentsAndQuotedStrings(code: string): string {
  let result = "";
  let state: "code" | "single" | "double" | "template" | "line" | "block" = "code";
  for (let index = 0; index < code.length; index++) {
    const character = code[index]!;
    const next = code[index + 1];
    if (state === "code" && character === "/" && next === "/") { state = "line"; result += "  "; index++; continue; }
    if (state === "code" && character === "/" && next === "*") { state = "block"; result += "  "; index++; continue; }
    if (state === "line" && character === "\n") { state = "code"; result += "\n"; continue; }
    if (state === "block" && character === "*" && next === "/") { state = "code"; result += "  "; index++; continue; }
    if (state === "line" || state === "block") { result += " "; continue; }
    if (state === "code" && character === "'") { state = "single"; result += " "; continue; }
    if (state === "code" && character === '"') { state = "double"; result += " "; continue; }
    if (state === "code" && character === "`") { state = "template"; result += " "; continue; }
    if ((state === "single" || state === "double" || state === "template") && character === "\\") { result += "  "; index++; continue; }
    if (state === "single" && character === "'") { state = "code"; result += " "; continue; }
    if (state === "double" && character === '"') { state = "code"; result += " "; continue; }
    if (state === "template" && character === "`") { state = "code"; result += " "; continue; }
    result += state === "code" ? character : " ";
  }
  return result;
}

function containsImport(code: string): boolean {
  return /(^|[^\w$.])import\b\s*(?:\(|["'{*]|[\w$])/m.test(withoutCommentsAndQuotedStrings(code));
}

function exportedNames(code: string): Set<string> {
  const names = new Set<string>();
  for (const match of code.matchAll(/export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([\w$]+)/g)) names.add(match[1]!);
  for (const match of code.matchAll(/export\s*{([\s\S]*?)}/g)) {
    for (const item of match[1]!.split(",")) {
      const pair = item.trim().split(/\s+as\s+/);
      if (pair[0]) names.add((pair[1] ?? pair[0]).trim());
    }
  }
  return names;
}

export function compilePublicSource(source: string): void {
  if (containsImport(source)) throw new Error("Cartridge imports are not available in tynt v1");
  try {
    new Bun.Transpiler({ loader: "ts", target: "browser" }).transformSync(source);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
  const exports = exportedNames(source);
  for (const lifecycle of ["init", "update", "draw"]) {
    if (!exports.has(lifecycle)) throw new Error(`Cartridge must export function ${lifecycle}()`);
  }
}
