import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const webRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(webRoot, "../..");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

async function render(
  source: string,
  output: string,
  width: number,
  height: number,
  artworkWidth = width,
  artworkHeight = height,
) {
  const svg = await Bun.file(resolve(repositoryRoot, source)).text();
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000;display:grid;place-items:center}svg{display:block;width:${artworkWidth}px;height:${artworkHeight}px}</style>${svg}`,
  );
  await page.screenshot({ path: resolve(repositoryRoot, output), animations: "disabled" });
}

for (const publicDirectory of ["apps/web/public", "apps/docs/public"]) {
  await render(
    "apps/web/public/tynt-mark.svg",
    `${publicDirectory}/favicon-32x32.png`,
    32,
    32,
    24,
    24,
  );
  await render(
    "apps/web/public/tynt-mark.svg",
    `${publicDirectory}/favicon-48x48.png`,
    48,
    48,
    36,
    36,
  );
  await render(
    "apps/web/public/tynt-mark.svg",
    `${publicDirectory}/apple-touch-icon.png`,
    180,
    180,
    120,
    120,
  );
}

await render("apps/web/public/tynt-social.svg", "apps/web/public/tynt-social.png", 1200, 630);

await browser.close();
console.info("Rendered tynt icon and social assets.");
