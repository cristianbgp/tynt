import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "bun:test";

const root = new URL("../../../", import.meta.url);

function projectPath(path: string): URL {
  return new URL(path, root);
}

function readProjectFile(path: string): string {
  return readFileSync(projectPath(path), "utf8");
}

function isIgnored(path: string): boolean {
  return Bun.spawnSync(["git", "check-ignore", "--quiet", "--", path], {
    cwd: fileURLToPath(root),
  }).exitCode === 0;
}

describe("public repository health", () => {
  test("publishes MIT licensing and repository metadata", () => {
    const packageMetadata = JSON.parse(readProjectFile("package.json"));

    expect(readProjectFile("LICENSE")).toStartWith("MIT License\n");
    expect(packageMetadata).toMatchObject({
      license: "MIT",
      author: "Cristian Granda (https://cristianbgp.com)",
      repository: {
        type: "git",
        url: "https://github.com/cristianbgp/tynt.git",
      },
      bugs: {
        url: "https://github.com/cristianbgp/tynt/issues",
      },
      homepage: "https://github.com/cristianbgp/tynt#readme",
    });
  });

  test("provides the community files used by GitHub", () => {
    for (const path of [
      "CODE_OF_CONDUCT.md",
      ".github/CODEOWNERS",
      ".github/ISSUE_TEMPLATE/config.yml",
      ".github/ISSUE_TEMPLATE/bug_report.yml",
      ".github/ISSUE_TEMPLATE/feature_request.yml",
      ".github/ISSUE_TEMPLATE/cartridge_submission.yml",
    ]) {
      expect(existsSync(projectPath(path)), path).toBe(true);
    }
  });

  test("lets the apps/web Vercel root use framework defaults", () => {
    expect(existsSync(projectPath("vercel.json"))).toBe(false);
    expect(existsSync(projectPath("apps/web/vercel.json"))).toBe(false);
  });

  test("deploys docs with the Bun version that owns its lockfile", () => {
    const configuration = JSON.parse(readProjectFile("apps/docs/vercel.json"));

    expect(configuration).toMatchObject({
      framework: null,
      bunVersion: "1.4.x",
      installCommand: "bunx bun@1.4.0 install --frozen-lockfile",
      buildCommand: "bunx bun@1.4.0 run build",
      outputDirectory: "dist",
    });
  });

  test("installs the Playwright browser before running the CI check", () => {
    const workflow = readProjectFile(".github/workflows/check.yml");
    const browserInstall = workflow.indexOf("bun run --cwd apps/web playwright install --with-deps chromium");
    const check = workflow.indexOf("bun run check");

    expect(browserInstall).toBeGreaterThan(-1);
    expect(check).toBeGreaterThan(browserInstall);
  });

  test("keeps project copy free of em dashes", () => {
    const emDash = String.fromCodePoint(0x2014);
    for (const path of ["README.md", "apps/web/index.html", "apps/web/vite.config.ts"]) {
      expect(readProjectFile(path), `${path} should not contain em dashes`).not.toContain(emDash);
    }
  });

  test("centers social artwork inside a crop-safe composition", () => {
    const social = readProjectFile("apps/web/public/tynt-social.svg");

    expect(social).toContain('viewBox="0 0 1200 630"');
    expect(social).toContain('id="social-content" transform="translate(600 315)"');
    expect(social.match(/text-anchor="middle"/g)).toHaveLength(2);
  });

  test("keeps every local README link available in the public repository", () => {
    const links = [...readProjectFile("README.md").matchAll(/\[[^\]]*\]\(([^)]+)\)/g)]
      .map((match) => match[1])
      .filter((link): link is string => Boolean(link))
      .filter((link) => !/^(?:[a-z]+:|#)/i.test(link))
      .map((link) => decodeURIComponent(link.split(/[?#]/, 1)[0]));

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(existsSync(projectPath(link)), `${link} should exist`).toBe(true);
      expect(isIgnored(link), `${link} should not be ignored`).toBe(false);
    }
  });
});
