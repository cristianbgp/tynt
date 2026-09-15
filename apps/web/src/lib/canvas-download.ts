function screenshotFilename(filename: string): string {
  const base = filename.replace(/\.tynt$/i, "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tynt-screenshot";
  return `${base}.png`;
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create screenshot")), "image/png");
  });
}

export async function downloadCanvasPng(source: HTMLCanvasElement, filename: string, scale = 2): Promise<void> {
  const output = document.createElement("canvas");
  output.width = source.width * scale;
  output.height = source.height * scale;
  const context = output.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0, output.width, output.height);
  const url = URL.createObjectURL(await canvasBlob(output));
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = screenshotFilename(filename);
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
