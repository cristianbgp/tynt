import { expect, test } from "@playwright/test";

const docs = "http://127.0.0.1:4174";

test("custom docs are creator-first and responsive", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${docs}/docs`);
  await expect(page.getByRole("heading", { name: "Create tiny games with tynt" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Documentation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search documentation" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.getByRole("button", { name: "Open documentation navigation" })).toBeVisible();
  await page.getByRole("button", { name: "Open documentation navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Documentation navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Getting started" })).toBeVisible();
});

test("mobile header controls stay separate from the brand and page content", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${docs}/docs`);

  const brand = page.getByRole("link", { name: "tynt docs" });
  const brandLabel = await brand.locator("span:visible").last().boundingBox();
  const search = await page.getByRole("button", { name: "Search documentation" }).boundingBox();
  const header = await page.locator("body > div > header").boundingBox();
  const content = await page.locator("#docs-content").boundingBox();

  expect(brandLabel).not.toBeNull();
  expect(search).not.toBeNull();
  expect(header).not.toBeNull();
  expect(content).not.toBeNull();
  expect(brandLabel!.x + brandLabel!.width).toBeLessThanOrEqual(search!.x);
  expect(header!.y + header!.height).toBeLessThanOrEqual(content!.y);
});

test("search opens from the keyboard and finds API entries", async ({ page }) => {
  await page.goto(`${docs}/docs`);
  await expect(page.locator("html")).toHaveAttribute("data-docs-ready", "true");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Search documentation" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("searchbox").fill("camera");
  await expect(dialog.getByRole("link", { name: /camera/i }).first()).toBeVisible();
});

test("API reference and old TypeDoc routes remain useful on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${docs}/docs/reference/cartridge-api`);
  await expect(page.locator("h1").filter({ hasText: "Cartridge API" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Drawing" })).toBeVisible();
  await expect(page.getByText("clear(color = 0)", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Raw Markdown" })).toHaveAttribute("href", "/docs/reference/cartridge-api.md");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  await page.goto(`${docs}/documents/Getting_Started.html`);
  await expect(page).toHaveURL(`${docs}/docs/getting-started`);
  await expect(page.getByRole("heading", { name: "Make your first cartridge" })).toBeVisible();
});
