import { PALETTE, PixelSurface, applyCommand, type DrawCommand } from "@tynt/core";

interface ImageBuffer { data: Uint8ClampedArray }
export interface CanvasTarget {
  imageSmoothingEnabled: boolean;
  createImageData(width: number, height: number): ImageBuffer;
  putImageData(image: ImageBuffer, x: number, y: number): void;
}

const RGB = PALETTE.map((hex) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
]);

export class CanvasRenderer {
  readonly surface: PixelSurface;

  constructor(private readonly context: CanvasTarget, width = 160, height = 144) {
    this.surface = new PixelSurface(width, height, 0);
    this.context.imageSmoothingEnabled = false;
  }

  replay(commands: DrawCommand[]): void {
    for (const command of commands) applyCommand(this.surface, command);
    const image = this.context.createImageData(this.surface.width, this.surface.height);
    for (let index = 0; index < this.surface.data.length; index++) {
      const [red, green, blue] = RGB[this.surface.data[index]]!;
      const offset = index * 4;
      image.data[offset] = red;
      image.data[offset + 1] = green;
      image.data[offset + 2] = blue;
      image.data[offset + 3] = 255;
    }
    this.context.putImageData(image, 0, 0);
  }
}
