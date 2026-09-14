import { afterEach, describe, expect, test } from "bun:test";

const docsRoot = new URL("..", import.meta.url).pathname;
let process: ReturnType<typeof Bun.spawn> | undefined;

afterEach(async () => {
  process?.kill();
  await process?.exited;
  process = undefined;
});

async function readStartup(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      output += decoder.decode(value, { stream: true });
      const match = output.match(/Local:\s+(http:\/\/127\.0\.0\.1:\d+\/)/);
      if (match && output.includes("html generated at ./dist")) {
        return { output, url: match[1] };
      }
    }
  } finally {
    reader.releaseLock();
  }

  throw new Error(`Docs dev server exited before completing startup:\n${output}`);
}

describe("documentation development server", () => {
  async function startDevServer() {
    process = Bun.spawn(["bun", "run", "dev"], {
      cwd: docsRoot,
      env: { ...processEnv(), TYNT_DOCS_PORT: "0", NO_COLOR: "1" },
      stdout: "pipe",
      stderr: "pipe",
    });

    return Promise.race([
      readStartup(process.stdout),
      Bun.sleep(3_000).then(() => {
        throw new Error("Docs dev server did not complete startup");
      }),
    ]);
  }

  test("prints its banner after TypeDoc completes the initial watch build", async () => {
    const { output } = await startDevServer();

    expect(output.indexOf("html generated at ./dist")).toBeLessThan(output.indexOf("Local:"));
  }, 5_000);

  test("serves the generated documentation at its announced local URL", async () => {
    const { url } = await startDevServer();
    const response = await fetch(url);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("tynt");
  }, 5_000);
});

function processEnv(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(Bun.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}
