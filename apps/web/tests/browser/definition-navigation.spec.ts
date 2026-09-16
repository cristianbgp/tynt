import { expect, test, type Locator } from "@playwright/test";
import { importSource } from "./fixtures";

async function textPoint(line: Locator, text: string): Promise<{ x: number; y: number }> {
  return line.evaluate((element, value) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const index = node.textContent?.indexOf(value) ?? -1;
      if (index < 0) continue;
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + value.length);
      const rect = range.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    throw new Error(`${value} not found`);
  }, text);
}

test("Ctrl-click jumps from a local function call to its declaration", async ({ page }) => {
  await page.goto("/");
  await importSource(
    page,
    `function helper() { return 1; }

export function init() {}
export function update() { helper(); }
export function draw() {}`,
  );

  const callLine = page.locator(".cm-line").filter({ hasText: "update() { helper(); }" });
  const point = await textPoint(callLine, "helper");
  await page.keyboard.down("Control");
  await page.mouse.click(point.x, point.y);
  await page.keyboard.up("Control");

  await expect
    .poll(() =>
      page.evaluate(() => {
        const selection = window.getSelection();
        const element =
          selection?.anchorNode instanceof Element
            ? selection.anchorNode
            : selection?.anchorNode?.parentElement;
        return element?.closest(".cm-line")?.textContent ?? "";
      }),
    )
    .toContain("function helper");
});

test("modifier hover marks only navigable identifiers as links", async ({ page }) => {
  await page.goto("/");
  await importSource(
    page,
    `function helper() { return 1; }

export function init() {}
export function update() { helper(); }
export function draw() {}`,
  );

  const callLine = page.locator(".cm-line").filter({ hasText: "update() { helper(); }" });
  const point = await textPoint(callLine, "helper");
  await page.keyboard.down("Control");
  await page.mouse.move(point.x, point.y);

  const link = page.locator(".cm-definition-link");
  await expect(link).toHaveText("helper");
  await expect(link).toHaveCSS("cursor", "pointer");
  await expect(link).toHaveCSS("text-decoration-line", "underline");

  await page.keyboard.up("Control");
  await expect(link).toHaveCount(0);
});

test("F12 briefly highlights the local definition after jumping", async ({ page }) => {
  await page.goto("/");
  await importSource(
    page,
    `function helper() { return 1; }

export function init() {}
export function update() { helper(); }
export function draw() {}`,
  );

  const callLine = page.locator(".cm-line").filter({ hasText: "update() { helper(); }" });
  const point = await textPoint(callLine, "helper");
  await page.mouse.click(point.x, point.y);
  await page.keyboard.press("F12");

  await expect(page.locator(".cm-definition-target")).toContainText("function helper");
});

test("Ctrl-click on an exported lifecycle declaration opens its documentation", async ({
  page,
}) => {
  await page.goto("/");
  await importSource(
    page,
    `export function init() {}
export function update() {}
export function draw() {}`,
  );

  const declarationLine = page.locator(".cm-line").filter({ hasText: "function update" });
  const declarationToken = declarationLine.locator("span").filter({ hasText: "update" });
  await expect(declarationToken).toBeVisible();
  const box = await declarationToken.boundingBox();
  if (!box) throw new Error("update declaration has no bounding box");
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.keyboard.down("Control");
  await page.mouse.move(point.x, point.y);
  await expect(page.locator(".cm-definition-link")).toHaveText("update");
  const popupPromise = page.waitForEvent("popup", { timeout: 5_000 });
  await page.mouse.click(point.x, point.y);
  await page.keyboard.up("Control");
  const popup = await popupPromise;

  await expect(popup).toHaveURL("https://docs.tynt.dev/docs/reference/cartridge-api#update");
});
