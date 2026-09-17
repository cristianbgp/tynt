/** Width of every tynt framebuffer in pixels. */
export const CANVAS_WIDTH = 160 as const;
/** Height of every tynt framebuffer in pixels. */
export const CANVAS_HEIGHT = 144 as const;
/** The fixed four-color palette, ordered by color index. */
export const PALETTE = ["#000000", "#555555", "#aaaaaa", "#ffffff"] as const;

/** Every directional and action input available to a cartridge. */
export const INPUT_NAMES = ["left", "right", "up", "down", "a", "b"] as const;
/** A valid directional or action input name. */
export type InputName = (typeof INPUT_NAMES)[number];

/** A renderer command emitted for one tynt frame. Coordinates and colors are normalized when applied. */
export type DrawCommand =
  | {
      /** Selects the clear operation. */
      op: "clear";
      /** Indexed palette color. */
      color: number;
    }
  | {
      /** Selects the pixel operation. */
      op: "pixel";
      /** Horizontal pixel coordinate. */
      x: number;
      /** Vertical pixel coordinate. */
      y: number;
      /** Indexed palette color. */
      color: number;
    }
  | {
      /** Selects the line operation. */
      op: "line";
      /** Starting horizontal coordinate. */
      x0: number;
      /** Starting vertical coordinate. */
      y0: number;
      /** Ending horizontal coordinate. */
      x1: number;
      /** Ending vertical coordinate. */
      y1: number;
      /** Indexed palette color. */
      color: number;
    }
  | {
      /** Selects the rectangle operation. */
      op: "rect";
      /** Left edge coordinate. */
      x: number;
      /** Top edge coordinate. */
      y: number;
      /** Occupied width in pixels. */
      width: number;
      /** Occupied height in pixels. */
      height: number;
      /** Indexed palette color. */
      color: number;
      /** Whether to fill the rectangle interior. */
      fill: boolean;
    }
  | {
      /** Selects the circle operation. */
      op: "circle";
      /** Center horizontal coordinate. */
      x: number;
      /** Center vertical coordinate. */
      y: number;
      /** Radius in pixels. */
      radius: number;
      /** Indexed palette color. */
      color: number;
      /** Whether to fill the circle interior. */
      fill: boolean;
    }
  | {
      /** Selects the triangle operation. */
      op: "triangle";
      /** First vertex horizontal coordinate. */
      x1: number;
      /** First vertex vertical coordinate. */
      y1: number;
      /** Second vertex horizontal coordinate. */
      x2: number;
      /** Second vertex vertical coordinate. */
      y2: number;
      /** Third vertex horizontal coordinate. */
      x3: number;
      /** Third vertex vertical coordinate. */
      y3: number;
      /** Indexed palette color. */
      color: number;
      /** Whether to fill the triangle interior. */
      fill: boolean;
    }
  | {
      /** Selects the text operation. */
      op: "text";
      /** Printable ASCII text to draw with the built-in 3×5 bitmap font. Unsupported Unicode uses the question-mark glyph. */
      value: string;
      /** Starting horizontal coordinate. */
      x: number;
      /** Starting vertical coordinate. */
      y: number;
      /** Indexed palette color. */
      color: number;
    }
  | {
      /** Selects indexed sprite drawing. */
      op: "sprite";
      /** Row-major indexed palette values. */
      pixels: number[];
      /** Sprite width in pixels. */
      width: number;
      /** Sprite height in pixels. */
      height: number;
      /** Destination horizontal coordinate. */
      x: number;
      /** Destination vertical coordinate. */
      y: number;
      /** Indexed color skipped while drawing. */
      transparent: number;
    }
  | {
      /** Selects row-major tile-map drawing from an indexed spritesheet. */
      op: "map";
      /** Row-major sprite indexes for each map cell. */
      tiles: number[];
      /** Number of map cells in each row. */
      columns: number;
      /** Width of one tile in pixels. */
      tileWidth: number;
      /** Height of one tile in pixels. */
      tileHeight: number;
      /** Row-major indexed pixels containing every source tile. */
      spritesheet: number[];
      /** Number of tiles in each spritesheet row. */
      sheetColumns: number;
      /** Destination horizontal coordinate. */
      x: number;
      /** Destination vertical coordinate. */
      y: number;
      /** Indexed color skipped while drawing. */
      transparent: number;
    };

/** Immutable input values delivered to one engine update. */
export interface InputSnapshot {
  /** Inputs currently held down. */
  held: InputName[];
  /** Inputs newly pressed since the previous update. */
  pressed: InputName[];
  /** Inputs newly released since the previous update. */
  released: InputName[];
}
