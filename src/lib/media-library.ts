import { uid } from "./id";
import type { MediaItem, NewsroomData } from "./types";

export const MEDIA_UPLOAD_MAX_BYTES = 2_500_000;

export function mediaCopyUrl(item: MediaItem): string {
  return item.src;
}

export function readImageFile(file: File): Promise<{ dataUrl: string; width: number; height: number; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not-image"));
      return;
    }
    if (file.size > MEDIA_UPLOAD_MAX_BYTES) {
      reject(new Error("too-large"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("read-failed"));
        return;
      }
      const img = new Image();
      img.onload = () => resolve({ dataUrl: reader.result as string, width: img.naturalWidth, height: img.naturalHeight, mimeType: file.type });
      img.onerror = () => reject(new Error("decode-failed"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load-failed"));
    img.src = src;
  });
}

export async function cropImageToDataUrl(
  src: string,
  crop: { x: number; y: number; width: number; height: number },
  mimeType = "image/jpeg",
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await loadImageElement(src);
  const canvas = document.createElement("canvas");
  const w = Math.max(1, Math.round(crop.width));
  const h = Math.max(1, Math.round(crop.height));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, w, h);
  const quality = mimeType.includes("png") ? undefined : 0.9;
  const dataUrl = canvas.toDataURL(mimeType, quality);
  return { dataUrl, width: w, height: h };
}

export function addMediaItem(
  data: NewsroomData,
  partial: Omit<MediaItem, "id" | "createdAt"> & { id?: string; createdAt?: string },
): NewsroomData {
  const item: MediaItem = {
    id: partial.id ?? uid("med"),
    createdAt: partial.createdAt ?? new Date().toISOString(),
    title: partial.title,
    fileName: partial.fileName,
    src: partial.src,
    width: partial.width,
    height: partial.height,
    mimeType: partial.mimeType,
    alt: partial.alt,
  };
  return { ...data, mediaLibrary: [item, ...data.mediaLibrary] };
}

export function updateMediaItem(data: NewsroomData, id: string, patch: Partial<MediaItem>): NewsroomData {
  return {
    ...data,
    mediaLibrary: data.mediaLibrary.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  };
}

export function removeMediaItem(data: NewsroomData, id: string): NewsroomData {
  return { ...data, mediaLibrary: data.mediaLibrary.filter((item) => item.id !== id) };
}
