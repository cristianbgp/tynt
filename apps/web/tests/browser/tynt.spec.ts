import { expect, test } from "@playwright/test";
import { importSource, pixel } from "./fixtures";
import { PUBLIC_CARTRIDGES } from "../../src/generated/public-cartridges";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page, width: number) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
}

async function expectHoverColors(
  locator: import("@playwright/test").Locator,
  background: string,
  color: string,
) {
  await locator.hover();
  await expect(locator).toHaveCSS("background-color", background);
  await expect(locator).toHaveCSS("color", color);
}

const validCartridge = {
  format: "tynt",
  version: 1,
  title: "round trip",
  author: "cristianbgp",
  description: "A portable cartridge",
  controls: "A starts",
  source: "export function init(){}\nexport function update(){}\nexport function draw(){}",
  canvas: { width: 160, height: 144 },
  palette: { model: "indexed", colors: ["#000000", "#555555", "#aaaaaa", "#ffffff"] },
};

test("shows the compact controls and two-pane workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("tynt", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run" })).toBeVisible();
  await expect(page.locator("main")).toHaveCSS("grid-template-columns", /.+ .+/);
  await expect(page.locator("canvas")).toHaveAttribute("width", "160");
  await expect(page.locator("canvas")).toHaveAttribute("height", "144");
  await expect(page.locator("#status")).toHaveText("ready");
  await expect(page.locator("#draft-status")).toHaveText("autosave on");
  await expect(page.locator(".actions")).toHaveCSS("border-left-width", "0px");
  await expect(page.locator("#run-button")).toHaveCSS("border-left-width", "1px");
});

test("gives every editor interaction a distinct hover state", async ({ page }) => {
  await page.goto("/");

  await expectHoverColors(page.getByRole("link", { name: "tynt editor" }), "rgb(85, 85, 85)", "rgb(255, 255, 255)");
  await expectHoverColors(page.getByRole("button", { name: "Run" }), "rgb(0, 0, 0)", "rgb(255, 255, 255)");
  await expectHoverColors(page.getByRole("button", { name: "Direction right" }), "rgb(85, 85, 85)", "rgb(255, 255, 255)");

  await page.getByRole("button", { name: "Run" }).click();
  await expectHoverColors(page.getByRole("button", { name: "Stop" }), "rgb(85, 85, 85)", "rgb(255, 255, 255)");
  await page.getByRole("button", { name: "Stop" }).click();

  const disabledRun = page.getByRole("button", { name: "Run" });
  await disabledRun.evaluate((button) => button.setAttribute("disabled", ""));
  await expectHoverColors(disabledRun, "rgba(0, 0, 0, 0)", "rgb(119, 119, 119)");

  await page.setViewportSize({ width: 320, height: 568 });
  const gamePane = page.getByRole("button", { name: "Show game" });
  await expectHoverColors(gamePane, "rgb(0, 0, 0)", "rgb(255, 255, 255)");
  await gamePane.click();
  await expectHoverColors(gamePane, "rgb(85, 85, 85)", "rgb(255, 255, 255)");
});

test("gives sprite and recovery controls a distinct hover state", async ({ page }) => {
  await page.goto("/sprites");

  const darkPixel = page.getByRole("button", { name: "Pixel 1, 1 color 0" });
  await darkPixel.hover();
  await expect(darkPixel).toHaveCSS("outline-color", "rgb(255, 255, 255)");
  await expect(darkPixel).toHaveCSS("outline-style", "solid");

  const lightColor = page.getByRole("button", { name: "Color 3" });
  await lightColor.hover();
  await expect(lightColor).toHaveCSS("outline-color", "rgb(0, 0, 0)");
  await expect(lightColor).toHaveCSS("outline-style", "solid");

  await page.goto("/missing");
  await expectHoverColors(page.getByRole("link", { name: "Open editor" }), "rgb(0, 0, 0)", "rgb(255, 255, 255)");

  await page.goto("/gallery");
  await expectHoverColors(page.getByRole("link", { name: "Gallery" }), "rgb(85, 85, 85)", "rgb(255, 255, 255)");
  const puzzle = page.getByRole("button", { name: "puzzle" });
  await puzzle.click();
  await expectHoverColors(puzzle, "rgb(85, 85, 85)", "rgb(255, 255, 255)");
});

test("uses strong hover feedback for every docs control in explicit light and dark themes", async ({ page }) => {
  for (const theme of [
    {
      name: "light",
      system: "dark",
      pageBackground: "rgb(255, 255, 255)",
      hoverBackground: "rgb(0, 0, 0)",
      hoverColor: "rgb(255, 255, 255)",
    },
    {
      name: "dark",
      system: "light",
      pageBackground: "rgb(0, 0, 0)",
      hoverBackground: "rgb(255, 255, 255)",
      hoverColor: "rgb(0, 0, 0)",
    },
  ] as const) {
    await page.emulateMedia({ colorScheme: theme.system });
    await page.goto("http://127.0.0.1:4174/documents/Getting_Started.html");
    await page.getByRole("radio", { name: `${theme.name === "light" ? "Light" : "Dark"} theme` }).click();
    await expect(page.locator("body")).toHaveCSS("background-color", theme.pageBackground);

    const documentation = page.getByRole("navigation", { name: "Documentation" });
    await expectHoverColors(documentation.getByRole("link", { name: "Examples and recipes", exact: true }), theme.hoverBackground, theme.hoverColor);
    await expectHoverColors(page.getByRole("button", { name: "Search documentation" }), theme.hoverBackground, theme.hoverColor);
    await expectHoverColors(page.getByRole("button", { name: "Copy code" }).first(), theme.hoverBackground, theme.hoverColor);
    await expectHoverColors(page.getByRole("link", { name: "Raw Markdown" }), theme.hoverBackground, theme.hoverColor);

    const currentNavigation = page.getByRole("navigation", { name: "Documentation" }).getByRole("link", { name: "Getting started" });
    await expectHoverColors(currentNavigation, theme.hoverBackground, theme.hoverColor);
  }
});

test("responsive editor switches from code to a focused game", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Show code" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".editor-pane")).toBeVisible();
  await expect(page.locator(".workspace > .preview-pane")).toBeHidden();

  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByRole("button", { name: "Show game" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".workspace > .preview-pane")).toBeVisible();
  await expect(page.locator("#preview")).toBeFocused();
  await expectNoHorizontalOverflow(page, 320);
});

test("mobile editor keeps both toolbar rows at the site header height", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".topbar")).toBeVisible();

  const geometry = await page.evaluate(() => {
    const topbar = document.querySelector(".topbar")!.getBoundingClientRect();
    const fileControls = document.querySelector(".file-controls")!.getBoundingClientRect();
    const actions = document.querySelector(".actions")!.getBoundingClientRect();
    return {
      topbarHeight: topbar.height,
      fileControlsHeight: fileControls.height,
      actionsHeight: actions.height,
    };
  });

  expect(geometry).toEqual({
    topbarHeight: 82,
    fileControlsHeight: 41,
    actionsHeight: 41,
  });
});

test("mobile play keeps its identity and controls rows at the site header height", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play/public/starter");
  await expect(page.locator(".play-topbar")).toBeVisible();

  const geometry = await page.evaluate(() => {
    const topbar = document.querySelector(".play-topbar")!.getBoundingClientRect();
    const brand = document.querySelector(".play-topbar .brand")!.getBoundingClientRect();
    const identity = document.querySelector(".play-identity")!.getBoundingClientRect();
    const actions = document.querySelector(".play-actions")!.getBoundingClientRect();
    return {
      topbarHeight: topbar.height,
      brandHeight: brand.height,
      identityHeight: identity.height,
      actionsHeight: actions.height,
    };
  });

  expect(geometry).toEqual({
    topbarHeight: 82,
    brandHeight: 41,
    identityHeight: 41,
    actionsHeight: 41,
  });
});

test("responsive play keeps the game and controls close together", async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/play/public/coin-dash");
    await expect(page.locator("#preview")).toBeFocused();
    await expect(page.getByRole("link", { name: "Open gallery" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open library" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open sprites" })).toBeVisible();
    await expectNoHorizontalOverflow(page, viewport.width);
    const geometry = await page.evaluate(() => {
      const canvas = document.querySelector("canvas")!.getBoundingClientRect();
      const controls = document.querySelector(".emulator-controls")!.getBoundingClientRect();
      return { canvasWidth: canvas.width, canvasTop: canvas.top, gap: controls.top - canvas.bottom };
    });
    expect(geometry.canvasWidth).toBe(320);
    expect(geometry.canvasTop).toBeLessThan(210);
    expect(geometry.gap).toBeLessThan(48);
  }
});

test("desktop play keeps the game preview close to the top bar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/play/public/snake");
  await expect(page.locator("#preview")).toBeFocused();

  const topGap = await page.evaluate(() => {
    const stage = document.querySelector(".play-stage")!.getBoundingClientRect();
    const interaction = document.querySelector(".preview-interaction")!.getBoundingClientRect();
    return Math.round(interaction.top - stage.top);
  });

  expect(topGap).toBe(24);
});

test("mobile play disables page zoom and accidental text selection", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play/public/coin-dash");

  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    /maximum-scale=1.*user-scalable=no/,
  );
  await expect(page.locator(".play-stage")).toHaveCSS("user-select", "none");
});

test("mobile play balances the game stack and keeps its controls compact", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play/public/asteroids");
  await expect(page.locator(".play-stage")).toBeVisible();

  const geometry = await page.evaluate(() => {
    const stage = document.querySelector(".play-stage")!.getBoundingClientRect();
    const interaction = document.querySelector(".preview-interaction")!.getBoundingClientRect();
    const controls = document.querySelector(".emulator-controls")!.getBoundingClientRect();
    return {
      topGap: Math.round(interaction.top - stage.top),
      bottomGap: Math.round(stage.bottom - interaction.bottom),
      controlsWidth: Math.round(controls.width),
    };
  });

  expect(Math.abs(geometry.topGap - geometry.bottomGap)).toBeLessThanOrEqual(2);
  expect(geometry.controlsWidth).toBe(288);
});

test("responsive content routes reflow without footer overlap", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/gallery");
  await expectNoHorizontalOverflow(page, 320);
  await expect.poll(() => page.locator(".library-search-wrap").evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThan(280);
  await expect(page.locator(".gallery-tags")).toHaveCSS("overflow-x", "auto");

  await page.goto("/library");
  await expectNoHorizontalOverflow(page, 320);
  await expect(page.getByRole("link", { name: "Browse examples" })).toBeVisible();

  await page.goto("/sprites");
  await expectNoHorizontalOverflow(page, 320);
  await expect.poll(() => page.locator(".sprite-canvas button").first().evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(35);
});

test("serves the browser icon metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/apple-touch-icon.png");
});

test("content routes do not load editor or compiler resources", async ({ page }) => {
  for (const path of ["/gallery", "/library", "/sprites", "/cartridges/starter", "/missing"]) {
    const loaded: string[] = [];
    const onResponse = (response: import("@playwright/test").Response) => {
      loaded.push(new URL(response.url()).pathname);
    };
    page.on("response", onResponse);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    page.off("response", onResponse);

    expect(loaded.filter((url) =>
      url.includes("/runtime/compiler") ||
      url.includes("esbuild.wasm") ||
      url.includes("/@codemirror/") ||
      url.includes("/components/editor")), path).toEqual([]);
  }
});

test("opens a responsive cartridge detail page from the gallery", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/gallery");
  await page.getByRole("link", { name: "View starter details" }).click();

  await expect(page).toHaveURL(/\/cartridges\/starter$/);
  await expect(page.getByRole("heading", { level: 1, name: "starter" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Play starter" })).toHaveAttribute("data-cuelume-hover", "tick");
  await expect(page.getByRole("link", { name: "Remix starter" })).toHaveAttribute("href", "/?cartridge=starter");
  await expect(page.getByRole("heading", { name: "About this cartridge" })).toBeVisible();
  await expectNoHorizontalOverflow(page, 320);
});

test("pauses, steps, restarts, and captures a cartridge in the editor debugger", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.locator("#status")).toHaveText("running");
  await page.getByRole("button", { name: "Open debugger" }).click();
  const debuggerPanel = page.getByRole("region", { name: "Runtime debugger" });

  await debuggerPanel.getByRole("button", { name: "Pause" }).click();
  await expect(page.locator("#status")).toHaveText("paused");
  const pausedFrame = Number((await debuggerPanel.getByText(/frame \d+/).textContent())?.match(/\d+/)?.[0]);
  await page.locator("#preview").dispatchEvent("keydown", { code: "KeyZ", key: "z" });
  await expect(debuggerPanel.locator('[data-held="true"]')).toContainText("a");
  await debuggerPanel.getByRole("button", { name: "Step frame" }).click();
  await expect(debuggerPanel.getByText(`frame ${pausedFrame + 1}`)).toBeVisible();
  await page.locator("#preview").dispatchEvent("keyup", { code: "KeyZ", key: "z" });

  const downloadPromise = page.waitForEvent("download");
  await debuggerPanel.getByRole("button", { name: "Screenshot" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("starter.png");

  await debuggerPanel.getByRole("button", { name: "Restart" }).click();
  await expect(page.locator("#status")).toHaveText("running");
  await expect.poll(async () => Number((await debuggerPanel.getByText(/frame \d+/).textContent())?.match(/\d+/)?.[0])).toBeGreaterThan(0);
});

test("opens a bundled cartridge from the gallery as an editable copy", async ({ page }) => {
  await page.goto("/gallery");
  await expect(page.getByRole("heading", { name: "Cartridge gallery" })).toBeVisible();
  await expect(page.getByRole("img", { name: /preview$/i })).toHaveCount(PUBLIC_CARTRIDGES.length);

  await page.getByRole("link", { name: "Open snake.tynt in editor" }).click();

  await expect(page).toHaveURL("http://127.0.0.1:4173/");
  await expect(page.locator("#filename")).toHaveText("snake.tynt");
  await expect(page.locator(".cm-content")).toContainText("segments");
});

test("saves metadata to the local library and manages a persistent copy", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Details" }).click();
  await page.getByRole("textbox", { name: "Title" }).fill("local demo");
  await page.getByRole("textbox", { name: "Author" }).fill("cristianbgp");
  await page.getByRole("textbox", { name: "Description" }).fill("A saved local cartridge");
  await page.getByRole("textbox", { name: "Controls" }).fill("Arrows move · A scores · B resets");
  await page.getByRole("button", { name: "Save details" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("#draft-status")).toHaveText("saved to library");

  await page.getByRole("link", { name: "Library" }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole("heading", { name: "local-demo.tynt" })).toBeVisible();
  await expect(page.getByAltText("Latest local demo preview")).toBeVisible();
  await page.getByRole("button", { name: "Duplicate local demo" }).click();
  await expect(page.getByRole("heading", { name: "local-demo-copy.tynt" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete local demo copy" }).click();
  await expect(page.getByRole("heading", { name: "local-demo-copy.tynt" })).toHaveCount(0);
});

test("plays a saved cartridge with focused pause, resume, and restart controls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page).toHaveURL(/\/play\/local\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "starter" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("running");
  await expect(page.locator("#preview")).toBeFocused();

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("status")).toHaveText("paused");
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("status")).toHaveText("running");
  await page.getByRole("button", { name: "Restart" }).click();
  await expect(page.locator("#preview")).toBeFocused();
  await expect(page.getByRole("link", { name: "Edit cartridge" })).toHaveAttribute("href", /\?local=/);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(1280);
  await expect.poll(() => page.evaluate(() => {
    const controls = document.querySelector(".emulator-controls")!.getBoundingClientRect();
    const footer = document.querySelector(".play-footer")!.getBoundingClientRect();
    return controls.bottom <= footer.top;
  })).toBe(true);

  await page.setViewportSize({ width: 320, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test("runs every repository cartridge", async ({ page }) => {
  for (const cartridge of PUBLIC_CARTRIDGES) {
    await page.goto(`/?cartridge=${cartridge.slug}`);
    await page.getByRole("button", { name: "Run" }).click();
    await expect(page.locator("#status"), cartridge.slug).toHaveText("running");
    await page.getByRole("button", { name: "Stop" }).click();
  }
});

test("imports and exports a readable v1 cartridge", async ({ page }) => {
  await page.goto("/");
  await page.locator("#file-input").setInputFiles({
    name: "round-trip.tynt",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(validCartridge)),
  });
  await expect(page.locator("#filename")).toHaveText("round-trip.tynt");
  await expect(page.locator(".cm-content")).toContainText("export function init");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("round-trip.tynt");
  const stream = await download.createReadStream();
  let text = "";
  for await (const chunk of stream) text += chunk.toString();
  expect(JSON.parse(text)).toEqual(validCartridge);
});

test("toolbar shortcuts run, import, and export", async ({ page }) => {
  await page.goto("/");
  const editor = page.locator(".cm-content");
  const preview = page.locator("#preview");
  const source = await editor.textContent();
  await editor.click();
  await page.keyboard.press("Control+Shift+Enter");
  await expect(page.locator("#status")).toHaveText("running");
  await expect(preview).toBeFocused();
  await expect(editor).toHaveText(source ?? "");

  await page.getByRole("button", { name: "Stop" }).click();

  const chooserPromise = page.waitForEvent("filechooser");
  await page.keyboard.press("Control+O");
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "shortcut.tynt",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(validCartridge)),
  });
  await expect(page.locator("#filename")).toHaveText("round-trip.tynt");

  const downloadPromise = page.waitForEvent("download");
  await page.keyboard.press("Control+S");
  expect((await downloadPromise).suggestedFilename()).toBe("round-trip.tynt");
});

test("opens tynt API suggestions with Control+Space", async ({ page }) => {
  await page.goto("/");
  await page.locator(".cm-content").click();
  await page.keyboard.press("Control+Space");

  const suggestions = page.locator(".cm-tooltip-autocomplete");
  await expect(suggestions).toBeVisible();
  await expect(suggestions).toContainText("clear");
  await expect(suggestions).toContainText("rect");
  await expect(suggestions).toContainText("buttonPressed");
  const selected = suggestions.locator("li[aria-selected=true]");
  await expect(selected).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(selected).toHaveCSS("color", "rgb(255, 255, 255)");
});

test("highlights TypeScript with the tynt monochrome token palette", async ({ page }) => {
  await page.goto("/");
  const tokenStyles = await page.locator(".cm-content").evaluate((content) => {
    const spans = [...content.querySelectorAll("span")];
    const keyword = spans.find((span) => span.textContent === "export");
    const string = spans.find((span) => span.textContent === '"left"');
    return {
      keyword: keyword ? {
        color: getComputedStyle(keyword).color,
        weight: getComputedStyle(keyword).fontWeight,
      } : null,
      string: string ? { color: getComputedStyle(string).color } : null,
    };
  });

  expect(tokenStyles).toEqual({
    keyword: { color: "rgb(0, 0, 0)", weight: "650" },
    string: { color: "rgb(85, 85, 85)" },
  });
});

test("failed import leaves the current editor intact", async ({ page }) => {
  await page.goto("/");
  await importSource(page, "export function init(){}\nexport function update(){}\nexport function draw(){ text(\"KEEP ME\",0,0,3); }", "keep me");
  await page.locator("#file-input").setInputFiles({
    name: "broken.tynt",
    mimeType: "application/json",
    buffer: Buffer.from("{"),
  });
  await expect(page.locator("#filename")).toHaveText("keep-me.tynt");
  await expect(page.locator(".cm-content")).toContainText("KEEP ME");
  await expect(page.locator("#error-console")).toBeVisible();
  await expect(page.locator(".preview-error")).toHaveCount(0);
  await expect(page.locator("#error-console")).toHaveCSS("border-top-color", "rgb(180, 35, 24)");
  await expect(page.locator("#error-console")).toHaveCSS("background-color", "rgb(255, 241, 240)");
});

test("compiles and runs the centered default cartridge, then stops", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(page.locator("#status")).toHaveText("running");
  await expect.poll(() => page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext("2d")!.getImageData(76, 61, 1, 1).data;
    return [...data];
  })).toEqual([255, 255, 255, 255]);
  await expect.poll(() => page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const { data, width, height } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        if (data[offset] === 0 && data[offset + 1] === 0 && data[offset + 2] === 0) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }

    return { minX, maxX, minY, maxY };
  })).toEqual({ minX: 8, maxX: 86, minY: 10, maxY: 81 });
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.getByRole("button", { name: "Run" })).toBeVisible();
  await expect(page.locator("#status")).toHaveText("stopped");
  await expect(page.locator("iframe.runtime-sandbox")).toHaveCount(0);
});

test("the default cartridge demonstrates clickable directions, A, and B", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.locator("#status")).toHaveText("running");
  await expect.poll(() => pixel(page, 76, 61)).toEqual([255, 255, 255, 255]);

  const right = page.getByRole("button", { name: "Direction right" });
  const box = await right.boundingBox();
  if (!box) throw new Error("Direction right is not visible");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(() => pixel(page, 83, 61)).toEqual([0, 0, 0, 255]);
  await page.mouse.up();

  let movedX = -1;
  await expect.poll(async () => {
    movedX = await page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
      const data = canvas.getContext("2d")!.getImageData(0, 61, canvas.width, 1).data;
      for (let x = 0; x < canvas.width; x++) {
        if (data[x * 4] > 0) return x;
      }
      return -1;
    });
    return movedX;
  }).toBeGreaterThan(83);

  await page.getByRole("button", { name: "Action A" }).click();
  await expect.poll(() => pixel(page, movedX, 61)).toEqual([85, 85, 85, 255]);

  await page.getByRole("button", { name: "Action B" }).click();
  await expect.poll(() => pixel(page, 76, 61)).toEqual([255, 255, 255, 255]);
  await expect.poll(() => pixel(page, movedX, 61)).toEqual([0, 0, 0, 255]);
});

test("reruns successfully and preserves the old run after a compile error", async ({ page }) => {
  await page.goto("/");
  await importSource(page, `export function init(){}\nexport function update(){}\nexport function draw(){ clear(0); pixel(0,0,1); }`);
  await page.getByRole("button", { name: "Run" }).click();
  await expect.poll(() => pixel(page, 0, 0)).toEqual([85, 85, 85, 255]);
  await importSource(page, `export function init(){}\nexport function update(){}\nexport function draw(){ clear(0); pixel(0,0,3); }`);
  await page.locator(".cm-content").press("Control+Shift+Enter");
  await expect.poll(() => pixel(page, 0, 0)).toEqual([255, 255, 255, 255]);
  await expect(page.locator("iframe.runtime-sandbox")).toHaveCount(1);

  await importSource(page, `export function init( {`);
  await page.locator(".cm-content").press("Control+Shift+Enter");
  await expect(page.locator("#error-console")).toContainText("cartridge.ts");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(page.locator("iframe.runtime-sandbox")).toHaveCount(1);
  await expect.poll(() => pixel(page, 0, 0)).toEqual([255, 255, 255, 255]);
  await expect(page.locator(".preview-error")).toHaveCount(0);
});

test("delivers held and pressed keyboard transitions while preview is focused", async ({ page }) => {
  await page.goto("/");
  await importSource(page, `
    let pressed = 0;
    export function init(){}
    export function update(){ if(buttonPressed("a")) pressed++; }
    export function draw(){ clear(0); pixel(button("a") ? 0 : 1, pressed, 3); }
  `);
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.locator("#status")).toHaveText("running");
  const preview = page.locator("#preview");
  await preview.click();
  await expect(preview).toBeFocused();
  await preview.press("z", { delay: 60 });
  await expect.poll(() => pixel(page, 1, 1)).toEqual([255, 255, 255, 255]);
  await preview.evaluate((element) => {
    element.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyZ", key: "z", bubbles: true }));
    (element as HTMLElement).blur();
  });
  await preview.focus();
  await expect.poll(() => pixel(page, 1, 2)).toEqual([0, 0, 0, 255]);
});

test("maps runtime errors to cartridge source and tears down the sandbox", async ({ page }) => {
  await page.goto("/");
  await importSource(page, `export function init(){}\nexport function update(){\n  throw new Error("player boom");\n}\nexport function draw(){}`);
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.locator("#error-console")).toContainText("update: player boom");
  await expect(page.locator("#error-console")).toContainText(/cartridge\.ts:3:\d+/);
  await expect(page.locator("#error-console")).not.toContainText(/worker-source|iframe-source|sandbox\.ts/);
  await expect(page.locator("iframe.runtime-sandbox")).toHaveCount(0);
  await expect(page.locator(".preview-error")).toContainText("Run error");
  await expect(page.locator(".preview-error")).toContainText("Check details below");
});

test("watchdog stops an infinite update without freezing the editor", async ({ page }) => {
  await page.goto("/");
  await importSource(page, `export function init(){}\nexport function update(){ while(true){} }\nexport function draw(){}`);
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.locator("#error-console")).toContainText("update exceeded 100 ms", { timeout: 3_000 });
  await expect(page.locator("iframe.runtime-sandbox")).toHaveCount(0);
  await page.locator(".cm-content").click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("\n// still responsive");
  await expect(page.locator(".cm-content")).toContainText("still responsive");
});

test("cartridges cannot reach host, storage, cookies, workers, or network", async ({ page }) => {
  const escaped: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.origin !== "http://127.0.0.1:4173") escaped.push(request.url());
  });
  await page.goto("/");
  await importSource(page, `
    let denied = false;
    export function init(){
      denied = typeof document === "undefined" && typeof parent === "undefined" &&
        globalThis.fetch === undefined && globalThis.XMLHttpRequest === undefined &&
        globalThis.WebSocket === undefined && globalThis.localStorage === undefined &&
        globalThis.indexedDB === undefined && globalThis.Worker === undefined &&
        typeof importScripts === "undefined";
    }
    export function update(){}
    export function draw(){ clear(0); pixel(0,0,denied ? 3 : 1); }
  `);
  await page.getByRole("button", { name: "Run" }).click();
  await expect.poll(() => pixel(page, 0, 0)).toEqual([255, 255, 255, 255]);
  expect(escaped).toEqual([]);
  const sandbox = page.locator("iframe.runtime-sandbox");
  await expect(sandbox).toHaveAttribute("sandbox", "allow-scripts");
});

test("keeps the workspace accessible and fits the preview frame to an integer-scaled canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Current cartridge file")).toHaveText("starter.tynt");
  await expect(page.getByRole("button", { name: "Examples" })).toHaveAttribute("aria-haspopup", "menu");
  await expect(page.locator("#preview")).toHaveAttribute("tabindex", "0");
  await expect(page.locator("#status")).toHaveAttribute("role", "status");
  await expect(page.locator("#error-console")).toHaveAttribute("role", "alert");
  await expect(page.locator("#file-input")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#status-hint")).toContainText(/run/i);
  const previewSize = async () => page.locator(".preview-interaction").evaluate((preview) => {
    const canvas = preview.querySelector("canvas")!.getBoundingClientRect();
    const frame = preview.querySelector(".preview-frame")!.getBoundingClientRect();
    return {
      canvas: { width: canvas.width, height: canvas.height },
      frame: { width: frame.width, height: frame.height },
    };
  });
  await expect.poll(previewSize).toEqual({
    canvas: { width: 320, height: 288 },
    frame: { width: 322, height: 290 },
  });
  await page.setViewportSize({ width: 800, height: 800 });
  await expect.poll(previewSize).toEqual({
    canvas: { width: 320, height: 288 },
    frame: { width: 322, height: 290 },
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(page.locator("main")).toHaveCSS("grid-template-columns", "320px");
  await page.getByRole("button", { name: "Show game" }).click();
  await expect.poll(previewSize).toEqual({
    canvas: { width: 320, height: 288 },
    frame: { width: 320, height: 288 },
  });
});

test("keeps the status bar flush with the viewport when errors are hidden or visible", async ({ page }) => {
  await page.goto("/");
  const statusBox = () => page.locator(".status-bar").evaluate((status) => {
    const bounds = status.getBoundingClientRect();
    return { bottom: bounds.bottom, height: bounds.height, viewportBottom: window.innerHeight };
  });

  await expect.poll(statusBox).toEqual({ bottom: 800, height: 25, viewportBottom: 800 });
  await expect(page.locator("#error-console")).toBeHidden();

  await page.locator("#file-input").setInputFiles({
    name: "broken.tynt",
    mimeType: "application/json",
    buffer: Buffer.from("{"),
  });

  await expect(page.locator("#error-console")).toBeVisible();
  await expect.poll(statusBox).toEqual({ bottom: 800, height: 25, viewportBottom: 800 });
});

test("keeps the public play footer flush with the viewport", async ({ page }) => {
  await page.goto("/play/public/snake");
  await expect(page.getByRole("heading", { name: "snake" })).toBeVisible();
  await expect(page.locator("#error-console")).toBeHidden();

  const footerBox = () => page.locator(".play-footer").evaluate((footer) => {
    const bounds = footer.getBoundingClientRect();
    return { bottom: bounds.bottom, height: bounds.height, viewportBottom: window.innerHeight };
  });

  await expect.poll(footerBox).toEqual({ bottom: 800, height: 25, viewportBottom: 800 });
});

test("keeps the editor footer actions contiguous without horizontal overflow", async ({ page }) => {
  await page.goto("/");

  const footerActions = page.locator(".status-bar .footer-actions");
  await expect(footerActions).toBeVisible();
  await expect.poll(() => footerActions.evaluate((actions) => {
    const items = [...actions.children].map((item) => item.getBoundingClientRect());
    return {
      gaps: items.slice(1).map((item, index) => Math.round(item.left - items[index].right)),
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })).toEqual({ gaps: [0, 0, 0], pageOverflow: 0 });
});

test("keeps keyboard focus on the screen and renders the D-pad as one cross", async ({ page }) => {
  await page.goto("/");
  const preview = page.locator("#preview");
  const frame = page.locator(".preview-frame");
  await preview.focus();
  await page.keyboard.press("ArrowRight");

  await expect(preview).toHaveCSS("outline-style", "none");
  await expect(frame).toHaveCSS("outline-style", "solid");
  await expect(frame).toHaveCSS("outline-width", "2px");

  const dpadColors = await page.locator(".dpad").evaluate((dpad) => ({
    center: getComputedStyle(dpad.querySelector(".dpad-center")!).backgroundColor,
    buttons: [...dpad.querySelectorAll("button")].map((button) => ({
      background: getComputedStyle(button).backgroundColor,
      color: getComputedStyle(button).color,
    })),
  }));
  expect(dpadColors).toEqual({
    center: "rgb(0, 0, 0)",
    buttons: Array.from({ length: 4 }, () => ({
      background: "rgb(0, 0, 0)",
      color: "rgb(255, 255, 255)",
    })),
  });
});

test("uses matching 48 pixel touch targets for every part of the D-pad", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".dpad button, .dpad-center")).toHaveCount(5);
  const cells = await page.locator(".dpad button, .dpad-center").evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));

  expect(cells).toEqual(Array.from({ length: 5 }, () => ({ width: 48, height: 48 })));
});

test("uses the same black surface and pressed feedback for A and B", async ({ page }) => {
  await page.goto("/");
  const actionA = page.getByRole("button", { name: "Action A" });
  const actionB = page.getByRole("button", { name: "Action B" });

  for (const button of [actionA, actionB]) {
    await expect(button).toHaveCSS("background-color", "rgb(0, 0, 0)");
    await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");
  }

  const box = await actionA.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect(actionA).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(actionA).toHaveCSS("color", "rgb(0, 0, 0)");
  await page.mouse.up();
});

test("shows local draft progress and prevents duplicate runs while compiling", async ({ page }) => {
  await page.goto("/");
  await page.locator(".cm-content").click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("\n// saved demo");
  await expect(page.locator("#draft-status")).toHaveText("saving…");
  await expect(page.locator("#draft-status")).toHaveText("saved", { timeout: 1_000 });
  const run = page.locator("#run-button");
  await expect(run).toHaveText("Run");
  await run.click();
  await expect(run).toBeDisabled();
  await expect(page.getByRole("button", { name: "Stop" })).toBeEnabled();
});

test("loads bundled examples from the top bar with visible file extensions", async ({ page }) => {
  await page.goto("/");
  const examples = page.getByRole("button", { name: "Examples" });
  await examples.click();
  await page.getByRole("menuitem", { name: "shapes.tynt" }).click();

  await expect(page.getByLabel("Current cartridge file")).toHaveText("shapes.tynt");
  await expect(page.locator(".cm-content")).toContainText("circle(");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.locator("#status")).toHaveText("running");
  await page.getByRole("button", { name: "Stop" }).click();

  await examples.click();
  await page.getByRole("menuitem", { name: "animation.tynt" }).click();
  await expect(page.getByLabel("Current cartridge file")).toHaveText("animation.tynt");
  await expect(page.locator(".cm-content")).toContainText("velocity");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.locator("#status")).toHaveText("running");
});
