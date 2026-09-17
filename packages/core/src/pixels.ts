import type { DrawCommand } from "./api";

const FONT: Record<string, string> = {
  " ": "000000000000000",
  "?": "110001010000010",
  "!": "010010010000010",
  '"': "101101000000000",
  "#": "101111101111101",
  $: "011110010011110",
  "%": "101001010100101",
  "&": "010101010101011",
  "'": "010010000000000",
  "(": "001010010010001",
  ")": "100010010010100",
  "*": "000101010101000",
  "+": "000010111010000",
  ",": "000000000010100",
  "/": "001001010100100",
  ";": "000010000010100",
  "<": "001010100010001",
  "=": "000111000111000",
  ">": "100010001010100",
  "@": "111101111100111",
  "[": "110100100100110",
  "\\": "100100010001001",
  "]": "011001001001011",
  "^": "010101000000000",
  "`": "100010000000000",
  "{": "011010110010011",
  "|": "010010010010010",
  "}": "110010011010110",
  "~": "000011110000000",
  A: "010101111101101",
  B: "110101110101110",
  C: "011100100100011",
  D: "110101101101110",
  E: "111100110100111",
  F: "111100110100100",
  G: "011100101101011",
  H: "101101111101101",
  I: "111010010010111",
  J: "001001001101010",
  K: "101101110101101",
  L: "100100100100111",
  M: "101111111101101",
  N: "101111111111101",
  O: "010101101101010",
  P: "110101110100100",
  Q: "010101101111011",
  R: "110101110101101",
  S: "011100010001110",
  T: "111010010010010",
  U: "101101101101111",
  V: "101101101101010",
  W: "101101111111101",
  X: "101101010101101",
  Y: "101101010010010",
  Z: "111001010100111",
  "0": "111101101101111",
  "1": "010110010010111",
  "2": "110001111100111",
  "3": "110001110001110",
  "4": "101101111001001",
  "5": "111100110001110",
  "6": "011100110101010",
  "7": "111001010100100",
  "8": "010101010101010",
  "9": "010101011001110",
  ".": "000000000000010",
  ":": "000010000010000",
  "-": "000000111000000",
  _: "000000000000111",
};

/** Rounds a drawing coordinate to its nearest integer pixel. */
export function roundCoordinate(value: number): number {
  return Math.round(value);
}

/** Rounds a palette index and clamps it to the inclusive range from 0 to 3. */
export function clampColor(value: number): number {
  return Math.max(0, Math.min(3, Math.round(value)));
}

/** Mutable indexed-color framebuffer used by the deterministic renderer. */
export class PixelSurface {
  /** One palette index per pixel in row-major order. */
  readonly data: Uint8Array;

  /**
   * Creates a surface filled with an initial indexed color.
   * @param width - Surface width in pixels.
   * @param height - Surface height in pixels.
   * @param initial - Initial color index, clamped from 0 to 3.
   * @example
   * ```ts
   * const surface = new PixelSurface(160, 144, 0);
   * surface.set(10, 12, 3);
   * ```
   */
  constructor(
    /** Surface width in pixels. */
    readonly width: number,
    /** Surface height in pixels. */
    readonly height: number,
    initial = 0,
  ) {
    this.data = new Uint8Array(width * height);
    this.clear(initial);
  }

  /** Fills every pixel with a clamped palette index. */
  clear(color = 0): void {
    this.data.fill(clampColor(color));
  }

  /** Sets one rounded coordinate when it lies inside the surface. */
  set(x: number, y: number, color: number): void {
    const px = roundCoordinate(x);
    const py = roundCoordinate(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return;
    this.data[py * this.width + px] = clampColor(color);
  }
}

function drawLine(
  surface: PixelSurface,
  x0Value: number,
  y0Value: number,
  x1Value: number,
  y1Value: number,
  color: number,
): void {
  let x0 = roundCoordinate(x0Value);
  let y0 = roundCoordinate(y0Value);
  const x1 = roundCoordinate(x1Value);
  const y1 = roundCoordinate(y1Value);
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  while (true) {
    surface.set(x0, y0, color);
    if (x0 === x1 && y0 === y1) break;
    const doubled = error * 2;
    if (doubled >= dy) {
      error += dy;
      x0 += sx;
    }
    if (doubled <= dx) {
      error += dx;
      y0 += sy;
    }
  }
}

function drawRect(
  surface: PixelSurface,
  command: Extract<DrawCommand, { op: "rect" }>,
): void {
  const x = roundCoordinate(command.x);
  const y = roundCoordinate(command.y);
  const width = roundCoordinate(command.width);
  const height = roundCoordinate(command.height);
  if (width <= 0 || height <= 0) return;
  if (command.fill) {
    for (let py = y; py < y + height; py++) {
      for (let px = x; px < x + width; px++) surface.set(px, py, command.color);
    }
    return;
  }
  drawLine(surface, x, y, x + width - 1, y, command.color);
  drawLine(
    surface,
    x,
    y + height - 1,
    x + width - 1,
    y + height - 1,
    command.color,
  );
  drawLine(surface, x, y, x, y + height - 1, command.color);
  drawLine(
    surface,
    x + width - 1,
    y,
    x + width - 1,
    y + height - 1,
    command.color,
  );
}

function circlePoints(
  surface: PixelSurface,
  cx: number,
  cy: number,
  x: number,
  y: number,
  color: number,
): void {
  const points = [
    [cx + x, cy + y],
    [cx - x, cy + y],
    [cx + x, cy - y],
    [cx - x, cy - y],
    [cx + y, cy + x],
    [cx - y, cy + x],
    [cx + y, cy - x],
    [cx - y, cy - x],
  ];
  for (const [px, py] of points) surface.set(px, py, color);
}

function drawCircle(
  surface: PixelSurface,
  command: Extract<DrawCommand, { op: "circle" }>,
): void {
  const cx = roundCoordinate(command.x);
  const cy = roundCoordinate(command.y);
  const radius = roundCoordinate(command.radius);
  if (radius <= 0) return;
  if (command.fill) {
    for (let y = -radius; y <= radius; y++) {
      const span = Math.floor(Math.sqrt(radius * radius - y * y));
      for (let x = -span; x <= span; x++)
        surface.set(cx + x, cy + y, command.color);
    }
    return;
  }
  let x = radius;
  let y = 0;
  let decision = 1 - radius;
  while (x >= y) {
    circlePoints(surface, cx, cy, x, y, command.color);
    y++;
    if (decision < 0) decision += 2 * y + 1;
    else {
      x--;
      decision += 2 * (y - x) + 1;
    }
  }
}

function triangleEdge(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  px: number,
  py: number,
): number {
  return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
}

function drawTriangle(
  surface: PixelSurface,
  command: Extract<DrawCommand, { op: "triangle" }>,
): void {
  const x1 = roundCoordinate(command.x1);
  const y1 = roundCoordinate(command.y1);
  const x2 = roundCoordinate(command.x2);
  const y2 = roundCoordinate(command.y2);
  const x3 = roundCoordinate(command.x3);
  const y3 = roundCoordinate(command.y3);
  if (!command.fill || triangleEdge(x1, y1, x2, y2, x3, y3) === 0) {
    drawLine(surface, x1, y1, x2, y2, command.color);
    drawLine(surface, x2, y2, x3, y3, command.color);
    drawLine(surface, x3, y3, x1, y1, command.color);
    return;
  }

  const minX = Math.max(0, Math.min(x1, x2, x3));
  const maxX = Math.min(surface.width - 1, Math.max(x1, x2, x3));
  const minY = Math.max(0, Math.min(y1, y2, y3));
  const maxY = Math.min(surface.height - 1, Math.max(y1, y2, y3));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const edges = [
        triangleEdge(x1, y1, x2, y2, x, y),
        triangleEdge(x2, y2, x3, y3, x, y),
        triangleEdge(x3, y3, x1, y1, x, y),
      ];
      if (!(edges.some((edge) => edge < 0) && edges.some((edge) => edge > 0))) {
        surface.set(x, y, command.color);
      }
    }
  }
}

function drawText(
  surface: PixelSurface,
  command: Extract<DrawCommand, { op: "text" }>,
): void {
  if ([...command.value].length > 1024)
    throw new Error("text() accepts at most 1,024 characters");
  const startX = roundCoordinate(command.x);
  let x = startX;
  let y = roundCoordinate(command.y);
  for (const rawCharacter of command.value) {
    if (rawCharacter === "\n") {
      x = startX;
      y += 6;
      continue;
    }
    const glyph = FONT[rawCharacter.toUpperCase()] ?? FONT["?"];
    for (let index = 0; index < glyph.length; index++) {
      if (glyph[index] === "1")
        surface.set(x + (index % 3), y + Math.floor(index / 3), command.color);
    }
    x += 4;
  }
}

function drawSprite(
  surface: PixelSurface,
  command: Extract<DrawCommand, { op: "sprite" }>,
): void {
  const width = Math.max(0, roundCoordinate(command.width));
  const height = Math.max(0, roundCoordinate(command.height));
  const x = roundCoordinate(command.x);
  const y = roundCoordinate(command.y);
  const transparent = clampColor(command.transparent);
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const color = clampColor(command.pixels[py * width + px] ?? transparent);
      if (color !== transparent) surface.set(x + px, y + py, color);
    }
  }
}

function drawMap(
  surface: PixelSurface,
  command: Extract<DrawCommand, { op: "map" }>,
): void {
  const columns = Math.max(1, roundCoordinate(command.columns));
  const tileWidth = Math.max(1, roundCoordinate(command.tileWidth));
  const tileHeight = Math.max(1, roundCoordinate(command.tileHeight));
  const sheetColumns = Math.max(1, roundCoordinate(command.sheetColumns));
  const sheetWidth = sheetColumns * tileWidth;
  command.tiles.forEach((rawTile, index) => {
    const tile = Math.max(0, roundCoordinate(rawTile));
    const sourceX = (tile % sheetColumns) * tileWidth;
    const sourceY = Math.floor(tile / sheetColumns) * tileHeight;
    const pixels: number[] = [];
    for (let py = 0; py < tileHeight; py++) {
      for (let px = 0; px < tileWidth; px++)
        pixels.push(
          command.spritesheet[(sourceY + py) * sheetWidth + sourceX + px] ??
            command.transparent,
        );
    }
    drawSprite(surface, {
      op: "sprite",
      pixels,
      width: tileWidth,
      height: tileHeight,
      x: command.x + (index % columns) * tileWidth,
      y: command.y + Math.floor(index / columns) * tileHeight,
      transparent: command.transparent,
    });
  });
}

/** Applies one drawing command to an indexed pixel surface. */
export function applyCommand(
  surface: PixelSurface,
  command: DrawCommand,
): void {
  switch (command.op) {
    case "clear":
      surface.clear(command.color);
      break;
    case "pixel":
      surface.set(command.x, command.y, command.color);
      break;
    case "line":
      drawLine(
        surface,
        command.x0,
        command.y0,
        command.x1,
        command.y1,
        command.color,
      );
      break;
    case "rect":
      drawRect(surface, command);
      break;
    case "circle":
      drawCircle(surface, command);
      break;
    case "triangle":
      drawTriangle(surface, command);
      break;
    case "text":
      drawText(surface, command);
      break;
    case "sprite":
      drawSprite(surface, command);
      break;
    case "map":
      drawMap(surface, command);
      break;
  }
}
