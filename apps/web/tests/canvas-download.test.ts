// @vitest-environment jsdom

import { afterEach, expect, test, vi } from "vitest";
import { downloadCanvasPng } from "@/lib/canvas-download";

afterEach(() => vi.restoreAllMocks());

test("downloads a nearest-neighbor two-times PNG and revokes its URL", async () => {
  const source = document.createElement("canvas");
  source.width = 160;
  source.height = 144;
  const drawImage = vi.fn();
  const context = { imageSmoothingEnabled: true, drawImage };
  const output = {
    width: 0,
    height: 0,
    getContext: () => context,
    toBlob: (callback: BlobCallback) => callback(new Blob(["png"], { type: "image/png" })),
  };
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((tag: string) =>
    tag === "canvas" ? output : createElement(tag)) as typeof document.createElement);
  let downloaded = "";
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloaded = this.download;
  });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:screenshot");
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

  await downloadCanvasPng(source, "../My Game.tynt");

  expect(output).toMatchObject({ width: 320, height: 288 });
  expect(context.imageSmoothingEnabled).toBe(false);
  expect(drawImage).toHaveBeenCalledWith(source, 0, 0, 320, 288);
  expect(click).toHaveBeenCalledOnce();
  expect(downloaded).toBe("my-game.png");
  expect(revoke).toHaveBeenCalledWith("blob:screenshot");
});
