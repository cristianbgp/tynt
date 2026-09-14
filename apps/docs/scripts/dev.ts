import { exists } from "node:fs/promises";
import { watch } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { writeApiDocument } from "./generate-api";

const docsRoot = fileURLToPath(new URL("..", import.meta.url));
const outputRoot = resolve(docsRoot, "dist");
const hostname = "127.0.0.1";
const requestedPort = Number.parseInt(Bun.env.TYNT_DOCS_PORT ?? "4174", 10);
const port = Number.isInteger(requestedPort) && requestedPort >= 0 ? requestedPort : 4174;
const typedoc = Bun.which("typedoc");

if (!typedoc) {
  throw new Error("TypeDoc is not installed. Run `bun install` in apps/docs first.");
}

await writeApiDocument();
console.info("[info] generated creator API reference");

let regeneration = Promise.resolve();
const apiCatalogWatcher = watch(
  fileURLToPath(new URL("../../../packages/core/src/cartridge-api.ts", import.meta.url)),
  () => {
    regeneration = regeneration.then(async () => {
      await writeApiDocument();
      console.info("[info] regenerated creator API reference");
    }).catch((error) => console.error(error));
  },
);

const watcher = Bun.spawn([typedoc, "--watch"], {
  cwd: docsRoot,
  stdout: "pipe",
  stderr: "inherit",
});

let docsReady = false;
const server = Bun.serve({
  hostname,
  port,
  async fetch(request) {
    if (!docsReady) return new Response("Building documentation", { status: 503 });
    const filePath = await resolveRequestPath(new URL(request.url).pathname);
    if (!filePath) return new Response("Not found", { status: 404 });

    const file = Bun.file(filePath);
    if (!(await file.exists())) return new Response("Not found", { status: 404 });

    return new Response(file);
  },
});

const localUrl = `http://${hostname}:${server.port}/`;
const green = Bun.env.NO_COLOR ? "" : "\x1b[32m";
const reset = Bun.env.NO_COLOR ? "" : "\x1b[0m";
let markInitialBuildReady: () => void;
const initialBuildReady = new Promise<void>((resolve) => {
  markInitialBuildReady = resolve;
});

void relayTypeDocOutput();

let closing = false;

async function shutdown(exitCode = 0) {
  if (closing) return;
  closing = true;
  apiCatalogWatcher.close();
  server.stop(true);
  watcher.kill();
  await watcher.exited;
  process.exit(exitCode);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

watcher.exited.then((exitCode) => {
  if (!closing) void shutdown(exitCode);
});

await Promise.race([
  initialBuildReady,
  watcher.exited.then((exitCode) => {
    throw new Error(`TypeDoc watcher exited with code ${exitCode}.`);
  }),
]);

async function relayTypeDocOutput() {
  const marker = "html generated at ./dist";
  const decoder = new TextDecoder();
  let bufferedOutput = "";

  for await (const chunk of watcher.stdout) {
    process.stdout.write(chunk);
    bufferedOutput += decoder.decode(chunk, { stream: true });

    let markerIndex = bufferedOutput.indexOf(marker);
    while (markerIndex !== -1) {
      docsReady = true;
      printBanner();
      markInitialBuildReady();
      bufferedOutput = bufferedOutput.slice(markerIndex + marker.length);
      markerIndex = bufferedOutput.indexOf(marker);
    }

    if (bufferedOutput.length > marker.length) {
      bufferedOutput = bufferedOutput.slice(-marker.length);
    }
  }
}

function printBanner() {
  console.info(
    `\n  ${green}tynt docs${reset} ready\n\n  ${green}→${reset}  Local:     ${localUrl}\n  ${green}→${reset}  Watching:  packages/core and docs content\n`,
  );
}

async function resolveRequestPath(pathname: string): Promise<string | undefined> {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }

  const relativePath = decodedPath === "/" ? "index.html" : `.${decodedPath}`;
  let filePath = resolve(outputRoot, relativePath);

  if (filePath !== outputRoot && !filePath.startsWith(`${outputRoot}${sep}`)) return undefined;
  if (!extname(filePath) && (await exists(filePath))) filePath = resolve(filePath, "index.html");

  return filePath;
}
