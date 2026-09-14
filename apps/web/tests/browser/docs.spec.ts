import { expect, test } from "@playwright/test";

const docs = "http://127.0.0.1:4174";

test("generated docs are creator-first and responsive", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto(docs);
    await expect(page.getByRole("heading", { name: "Create tiny games with tynt" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    await expect(page.getByText("Getting Started", { exact: true }).first()).toBeAttached();
    await expect(page.getByText("Cartridge API", { exact: true }).first()).toBeAttached();
  }
});

test("generated API and engine reference remain readable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${docs}/documents/Cartridge_API.html`);
  await expect(page.locator("h1").filter({ hasText: "Cartridge API" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Drawing" })).toBeVisible();
  await expect(page.getByText("clear(color = 0)", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  await page.goto(`${docs}/modules/Engine.html`);
  await expect(page.getByRole("heading", { name: "Module Engine" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
