import { GIFEncoder, applyPalette, quantize } from "gifenc";
import html2canvas from "html2canvas";
import type { EventMapPreviewHandle } from "@/lib/event-map-preview-handle";

export type GifExportOptions = {
  frameCount?: number;
  delayMs?: number;
  width?: number;
};

export async function capturePreviewFrames(
  preview: EventMapPreviewHandle,
  frameCount: number,
): Promise<HTMLCanvasElement[]> {
  const container = preview.getContainer();
  if (!container) throw new Error("پیش‌نمایش نقشه آماده نیست.");
  await preview.waitForTiles();
  preview.setExportMode(true);
  const frames: HTMLCanvasElement[] = [];
  for (let i = 0; i < frameCount; i += 1) {
    const t = i / frameCount;
    preview.setAnimationProgress(t);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const shot = await html2canvas(container, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#f4f5f7",
      logging: false,
      scale: 1,
    });
    frames.push(shot);
  }
  preview.setExportMode(false);
  preview.setAnimationProgress(0);
  return frames;
}

export function encodeGifFromCanvases(frames: HTMLCanvasElement[], delayMs: number): Uint8Array {
  if (!frames.length) throw new Error("فریمی برای ساخت گیف وجود ندارد.");
  const width = frames[0].width;
  const height = frames[0].height;
  const gif = GIFEncoder();
  for (const frame of frames) {
    const ctx = frame.getContext("2d");
    if (!ctx) continue;
    const { data } = ctx.getImageData(0, 0, width, height);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, width, height, { palette, delay: delayMs });
  }
  gif.finish();
  return gif.bytes();
}

export async function exportRoutePreviewGif(
  preview: EventMapPreviewHandle,
  options: GifExportOptions = {},
): Promise<Blob> {
  const frameCount = options.frameCount ?? 24;
  const delayMs = options.delayMs ?? 125;
  const frames = await capturePreviewFrames(preview, frameCount);
  const bytes = encodeGifFromCanvases(frames, delayMs);
  return new Blob([bytes as BlobPart], { type: "image/gif" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
