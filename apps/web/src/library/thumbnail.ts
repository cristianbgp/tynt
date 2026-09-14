export function captureThumbnail(canvas: HTMLCanvasElement | null): string | undefined {
  if (!canvas) return undefined;
  try {
    const value = canvas.toDataURL("image/png");
    return value.startsWith("data:image/png") ? value : undefined;
  } catch {
    return undefined;
  }
}
