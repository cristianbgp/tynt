/** @internal Creator-facing groups used by autocomplete and generated documentation. */
export type CartridgeApiCategory =
  "lifecycle" | "drawing" | "input" | "world" | "deterministic" | "audio";

/** @internal One documented cartridge lifecycle or runtime function. */
export interface CartridgeApiEntry {
  readonly name: string;
  readonly signature: string;
  readonly description: string;
  readonly snippet: string;
  readonly category: CartridgeApiCategory;
  readonly example?: string;
  readonly notes?: string;
}

/** @internal Canonical cartridge API metadata shared by editor autocomplete and docs. */
export const CARTRIDGE_API = [
  {
    name: "init",
    signature: "export function init(): void",
    description: "Run once when the cartridge starts.",
    snippet: "export function init(): void {\n  ${1}\n}",
    category: "lifecycle",
  },
  {
    name: "update",
    signature: "export function update(): void",
    description: "Run at 60 Hz to update game state and read input.",
    snippet: "export function update(): void {\n  ${1}\n}",
    category: "lifecycle",
  },
  {
    name: "draw",
    signature: "export function draw(): void",
    description: "Run after every update to emit drawing commands.",
    snippet: "export function draw(): void {\n  ${1}\n}",
    category: "lifecycle",
  },
  {
    name: "clear",
    signature: "clear(color = 0)",
    description: "Fill the canvas with one palette color.",
    snippet: "clear(${1:color})",
    category: "drawing",
  },
  {
    name: "pixel",
    signature: "pixel(x, y, color)",
    description: "Draw one pixel.",
    snippet: "pixel(${1:x}, ${2:y}, ${3:color})",
    category: "drawing",
  },
  {
    name: "line",
    signature: "line(x0, y0, x1, y1, color)",
    description: "Draw a line between two points.",
    snippet: "line(${1:x0}, ${2:y0}, ${3:x1}, ${4:y1}, ${5:color})",
    category: "drawing",
  },
  {
    name: "rect",
    signature: "rect(x, y, width, height, color, fill = false)",
    description: "Draw an outlined or filled rectangle.",
    snippet:
      "rect(${1:x}, ${2:y}, ${3:width}, ${4:height}, ${5:color}, ${6:fill})",
    category: "drawing",
  },
  {
    name: "circle",
    signature: "circle(x, y, radius, color, fill = false)",
    description: "Draw an outlined or filled circle.",
    snippet: "circle(${1:x}, ${2:y}, ${3:radius}, ${4:color}, ${5:fill})",
    category: "drawing",
  },
  {
    name: "triangle",
    signature: "triangle(x1, y1, x2, y2, x3, y3, color, fill = false)",
    description: "Draw an outlined or filled triangle.",
    snippet:
      "triangle(${1:x1}, ${2:y1}, ${3:x2}, ${4:y2}, ${5:x3}, ${6:y3}, ${7:color}, ${8:fill})",
    category: "drawing",
  },
  {
    name: "text",
    signature: "text(value, x, y, color)",
    description: "Draw text with the built-in bitmap font.",
    snippet: 'text("${1:value}", ${2:x}, ${3:y}, ${4:color})',
    category: "drawing",
  },
  {
    name: "sprite",
    signature: "sprite(pixels, width, height, x, y, transparent = 0)",
    description: "Draw row-major indexed sprite pixels.",
    snippet: "sprite(${1:pixels}, ${2:8}, ${3:8}, ${4:x}, ${5:y}, ${6:0})",
    category: "drawing",
  },
  {
    name: "map",
    signature:
      "map(tiles, columns, tileWidth, tileHeight, spritesheet, sheetColumns, x = 0, y = 0, transparent = 0)",
    description: "Draw a row-major tile map from an indexed spritesheet.",
    snippet:
      "map(${1:tiles}, ${2:columns}, ${3:8}, ${4:8}, ${5:spritesheet}, ${6:sheetColumns}, ${7:0}, ${8:0}, ${9:0})",
    category: "drawing",
  },
  {
    name: "camera",
    signature: "camera(x = 0, y = 0)",
    description:
      "Offset subsequent drawing coordinates; call without arguments to reset.",
    snippet: "camera(${1:x}, ${2:y})",
    category: "world",
  },
  {
    name: "button",
    signature: "button(input)",
    description: "Check whether an input is currently held.",
    snippet: 'button("${1:input}")',
    category: "input",
  },
  {
    name: "buttonPressed",
    signature: "buttonPressed(input)",
    description: "Check whether an input was pressed this update.",
    snippet: 'buttonPressed("${1:input}")',
    category: "input",
  },
  {
    name: "buttonReleased",
    signature: "buttonReleased(input)",
    description: "Check whether an input was released this update.",
    snippet: 'buttonReleased("${1:input}")',
    category: "input",
  },
  {
    name: "seed",
    signature: "seed(value = 1)",
    description: "Reset the deterministic random sequence.",
    snippet: "seed(${1:value})",
    category: "deterministic",
  },
  {
    name: "random",
    signature: "random(min = 0, max = 1)",
    description: "Return the next deterministic random number.",
    snippet: "random(${1:0}, ${2:1})",
    category: "deterministic",
  },
  {
    name: "overlap",
    signature: "overlap(ax, ay, aw, ah, bx, by, bw, bh)",
    description: "Check two axis-aligned rectangles for overlap.",
    snippet:
      "overlap(${1:ax}, ${2:ay}, ${3:aw}, ${4:ah}, ${5:bx}, ${6:by}, ${7:bw}, ${8:bh})",
    category: "deterministic",
  },
  {
    name: "pointInRect",
    signature: "pointInRect(px, py, x, y, width, height)",
    description: "Check whether a point is inside a rectangle.",
    snippet:
      "pointInRect(${1:px}, ${2:py}, ${3:x}, ${4:y}, ${5:width}, ${6:height})",
    category: "deterministic",
  },
  {
    name: "clamp",
    signature: "clamp(value, min, max)",
    description: "Limit a value to an inclusive range.",
    snippet: "clamp(${1:value}, ${2:min}, ${3:max})",
    category: "deterministic",
  },
  {
    name: "wrap",
    signature: "wrap(value, min, max)",
    description: "Wrap a value into the half-open range from min to max.",
    snippet: "wrap(${1:value}, ${2:min}, ${3:max})",
    category: "deterministic",
  },
  {
    name: "frame",
    signature: "frame()",
    description: "Return the current deterministic update number.",
    snippet: "frame()",
    category: "deterministic",
  },
  {
    name: "every",
    signature: "every(interval, offset = 0)",
    description: "Return true on a repeating frame interval.",
    snippet: "every(${1:interval}, ${2:0})",
    category: "deterministic",
  },
  {
    name: "after",
    signature: "after(frames)",
    description: "Return true after a frame threshold.",
    snippet: "after(${1:frames})",
    category: "deterministic",
  },
  {
    name: "tone",
    signature:
      'tone(frequency, duration = 100, volume = 0.15, wave = "square")',
    description: "Play one bounded cartridge tone.",
    snippet: 'tone(${1:440}, ${2:100}, ${3:0.15}, "${4:square}")',
    category: "audio",
  },
  {
    name: "sfx",
    signature: 'sfx(notes, step = 80, volume = 0.15, wave = "square")',
    description:
      "Play up to 32 frequencies as a short effect; use 0 for a rest.",
    snippet: "sfx([${1:220}, ${2:0}, ${3:440}], ${4:80})",
    category: "audio",
  },
] as const satisfies readonly CartridgeApiEntry[];

/** @internal Cartridge API names in editor and documentation order. */
export const CARTRIDGE_API_NAMES = CARTRIDGE_API.map(({ name }) => name);
