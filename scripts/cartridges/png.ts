import { decode, encode } from "fast-png";
import { readPngDimensions } from "./validate";

const COVER_WIDTH = 320;
const COVER_HEIGHT = 288;

export function normalizeCover(bytes: Uint8Array): Uint8Array {
  try {
    const header = readPngDimensions(bytes);
    if (header.width !== COVER_WIDTH || header.height !== COVER_HEIGHT) {
      throw new Error(`Cartridge cover must be exactly ${COVER_WIDTH} × ${COVER_HEIGHT} pixels`);
    }
    const image = decode(bytes, { checkCrc: true });
    if (image.width !== COVER_WIDTH || image.height !== COVER_HEIGHT) {
      throw new Error(`Cartridge cover must be exactly ${COVER_WIDTH} × ${COVER_HEIGHT} pixels`);
    }
    return encode({
      width: image.width,
      height: image.height,
      data: image.data,
      depth: image.depth,
      channels: image.channels,
      ...(image.palette ? { palette: image.palette } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Cartridge cover must")) throw error;
    throw new Error(`Cartridge cover could not be decoded as a safe PNG: ${error instanceof Error ? error.message : String(error)}`);
  }
}
