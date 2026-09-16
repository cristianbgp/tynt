import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const root = resolve(import.meta.dirname, "..");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

async function render(source: string, output: string, width: number, height: number) {
  const svg = await Bun.file(resolve(root, source)).text();
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${svg}`,
  );
  await page.screenshot({ path: resolve(root, output), animations: "disabled" });
}

await render("public/tynt-mark.svg", "public/apple-touch-icon.png", 180, 180);
await render("public/tynt-social.svg", "public/tynt-social.png", 1200, 630);

await browser.close();
console.info("Rendered tynt icon and social assets.");
