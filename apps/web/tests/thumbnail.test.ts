import { describe, expect, test } from "vitest";
import { captureThumbnail } from "@/library/thumbnail";

describe("cartridge thumbnails", () => {
  test("captures a PNG data URL from a canvas", () => {
    const canvas = { toDataURL: () => "data:image/png;base64,preview" } as HTMLCanvasElement;
    expect(captureThumbnail(canvas)).toBe("data:image/png;base64,preview");
  });

  test("returns undefined when a browser cannot serialize the canvas", () => {
    const canvas = {
      toDataURL: () => {
        throw new Error("unsupported");
      },
    } as unknown as HTMLCanvasElement;
    expect(captureThumbnail(canvas)).toBeUndefined();
    expect(captureThumbnail(null)).toBeUndefined();
  });
});
