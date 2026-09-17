import { describe, expect, test } from "bun:test";
import { PixelSurface, applyCommand } from "../src";

function lit(surface: PixelSurface): number[] {
  return [...surface.data];
}

describe("indexed pixel renderer", () => {
  test("rounds coordinates, clips pixels, and clamps palette indexes", () => {
    const surface = new PixelSurface(3, 2, 0);
    applyCommand(surface, { op: "pixel", x: 1.49, y: 0.5, color: 9 });
    applyCommand(surface, { op: "pixel", x: -1, y: 0, color: 2 });
    expect(lit(surface)).toEqual([0, 0, 0, 0, 3, 0]);
  });

  test.each([
    [{ x0: 0, y0: 0, x1: 3, y1: 1 }, ["0,0", "1,0", "2,1", "3,1"]],
    [{ x0: 3, y0: 0, x1: 0, y1: 1 }, ["3,0", "2,0", "1,1", "0,1"]],
    [{ x0: 0, y0: 0, x1: 1, y1: 3 }, ["0,0", "0,1", "1,2", "1,3"]],
    [{ x0: 1, y0: 3, x1: 0, y1: 0 }, ["1,3", "1,2", "0,1", "0,0"]],
  ])("draws deterministic Bresenham octant %#", (line, expected) => {
    const surface = new PixelSurface(4, 4, 0);
    applyCommand(surface, { op: "line", ...line, color: 2 });
    const actual: string[] = [];
    surface.data.forEach(
      (color, index) =>
        color === 2 && actual.push(`${index % 4},${Math.floor(index / 4)}`),
    );
    expect(new Set(actual)).toEqual(new Set(expected));
  });

  test("draws filled and outlined rectangles with inclusive occupied dimensions", () => {
    const filled = new PixelSurface(5, 4, 0);
    applyCommand(filled, {
      op: "rect",
      x: 1,
      y: 1,
      width: 3,
      height: 2,
      color: 1,
      fill: true,
    });
    expect(lit(filled)).toEqual([
      0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0,
    ]);
    const outline = new PixelSurface(5, 4, 0);
    applyCommand(outline, {
      op: "rect",
      x: 1,
      y: 0,
      width: 3,
      height: 3,
      color: 2,
      fill: false,
    });
    expect(lit(outline)).toEqual([
      0, 2, 2, 2, 0, 0, 2, 0, 2, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0,
    ]);
  });

  test("draws filled and outlined circles and ignores non-positive geometry", () => {
    const filled = new PixelSurface(5, 5, 0);
    applyCommand(filled, {
      op: "circle",
      x: 2,
      y: 2,
      radius: 1,
      color: 3,
      fill: true,
    });
    expect(lit(filled)).toEqual([
      0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 3, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const before = lit(filled);
    applyCommand(filled, {
      op: "rect",
      x: 0,
      y: 0,
      width: 0,
      height: 2,
      color: 1,
      fill: true,
    });
    applyCommand(filled, {
      op: "circle",
      x: 0,
      y: 0,
      radius: 0,
      color: 1,
      fill: true,
    });
    expect(lit(filled)).toEqual(before);
  });

  test("draws filled and outlined triangles with inclusive edges", () => {
    const outline = new PixelSurface(5, 5, 0);
    applyCommand(outline, {
      op: "triangle",
      x1: 0,
      y1: 0,
      x2: 4,
      y2: 0,
      x3: 0,
      y3: 4,
      color: 2,
      fill: false,
    });
    expect(lit(outline)).toEqual([
      2, 2, 2, 2, 2, 2, 0, 0, 2, 0, 2, 0, 2, 0, 0, 2, 2, 0, 0, 0, 2, 0, 0, 0, 0,
    ]);

    const filled = new PixelSurface(5, 5, 0);
    applyCommand(filled, {
      op: "triangle",
      x1: 0,
      y1: 0,
      x2: 4,
      y2: 0,
      x3: 0,
      y3: 4,
      color: 3,
      fill: true,
    });
    expect(lit(filled)).toEqual([
      3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 3, 3, 3, 0, 0, 3, 3, 0, 0, 0, 3, 0, 0, 0, 0,
    ]);
  });

  test("renders newlines with a deterministic 3 by 5 bitmap font", () => {
    const surface = new PixelSurface(5, 11, 0);
    applyCommand(surface, { op: "text", value: "A\nA", x: 0, y: 0, color: 2 });
    const first = lit(surface).slice(0, 25);
    const second = lit(surface).slice(30, 55);
    expect(first).toEqual(second);
    expect(first).toEqual([
      0, 2, 0, 0, 0, 2, 0, 2, 0, 0, 2, 2, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 2, 0, 0,
    ]);
  });

  test("renders a slash as a diagonal instead of the fallback question mark", () => {
    const surface = new PixelSurface(3, 5, 0);
    applyCommand(surface, { op: "text", value: "/", x: 0, y: 0, color: 3 });
    expect(lit(surface)).toEqual([0, 0, 3, 0, 0, 3, 0, 3, 0, 3, 0, 0, 3, 0, 0]);
  });

  test("supports every printable ASCII punctuation glyph without falling back", () => {
    const punctuation = [
      "!",
      '"',
      "#",
      "$",
      "%",
      "&",
      "'",
      "(",
      ")",
      "*",
      "+",
      ",",
      "-",
      ".",
      "/",
      ":",
      ";",
      "<",
      "=",
      ">",
      "@",
      "[",
      "\\",
      "]",
      "^",
      "_",
      "`",
      "{",
      "|",
      "}",
      "~",
    ];
    const render = (character: string) => {
      const surface = new PixelSurface(3, 5, 0);
      applyCommand(surface, {
        op: "text",
        value: character,
        x: 0,
        y: 0,
        color: 1,
      });
      return lit(surface);
    };
    const fallback = render("?");

    expect(
      punctuation.filter((character) =>
        render(character).every((value, index) => value === fallback[index]),
      ),
    ).toEqual([]);
  });

  test("rejects text above 1024 Unicode code points", () => {
    const surface = new PixelSurface(2, 2, 0);
    expect(() =>
      applyCommand(surface, {
        op: "text",
        value: "🎮".repeat(1025),
        x: 0,
        y: 0,
        color: 1,
      }),
    ).toThrow(/1,024/);
  });

  test("renders a stable indexed frame", () => {
    const surface = new PixelSurface(8, 8, 0);
    applyCommand(surface, { op: "line", x0: 0, y0: 0, x1: 3, y1: 3, color: 7 });
    applyCommand(surface, {
      op: "rect",
      x: 1,
      y: 4,
      width: 3,
      height: 2,
      color: 2,
      fill: true,
    });
    expect(lit(surface)).toEqual([
      3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0,
      0, 0, 3, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
  });

  test("draws indexed sprites with transparent pixels", () => {
    const surface = new PixelSurface(4, 3, 0);
    applyCommand(surface, {
      op: "sprite",
      pixels: [1, 0, 2, 3],
      width: 2,
      height: 2,
      x: 1,
      y: 1,
      transparent: 0,
    });
    expect(lit(surface)).toEqual([0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 3, 0]);
  });

  test("draws maps from row-major tiles and a spritesheet", () => {
    const surface = new PixelSurface(4, 2, 0);
    applyCommand(surface, {
      op: "map",
      tiles: [1, 0],
      columns: 2,
      tileWidth: 2,
      tileHeight: 2,
      spritesheet: [1, 1, 2, 2, 1, 0, 2, 3],
      sheetColumns: 2,
      x: 0,
      y: 0,
      transparent: 0,
    });
    expect(lit(surface)).toEqual([2, 2, 1, 1, 2, 3, 1, 0]);
  });
});
