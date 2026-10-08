/** Max decoded source file size before we even try to compress */
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024
/** Soft warning after compression */
export const WARN_COMPRESSED_BYTES = 180 * 1024
/** Hard reject after compression (localStorage-friendly) */
export const MAX_COMPRESSED_BYTES = 350 * 1024
const MAX_EDGE = 960
const JPEG_QUALITY = 0.72

export type CompressResult =
  | { ok: true; dataUrl: string; bytes: number; warned: boolean }
  | { ok: false; error: string }

function dataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(',')
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl
  return Math.round((b64.length * 3) / 4)
}

export async function compressImageFile(file: File): Promise<CompressResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'فقط فایل تصویری مجاز است.' }
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return { ok: false, error: 'حجم فایل بیش از ۵ مگابایت است.' }
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return { ok: false, error: 'فشرده‌سازی تصویر ممکن نشد.' }
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  const bytes = dataUrlBytes(dataUrl)
  if (bytes > MAX_COMPRESSED_BYTES) {
    return {
      ok: false,
      error: 'پس از فشرده‌سازی هنوز تصویر بزرگ است. عکس ساده‌تری انتخاب کنید.',
    }
  }
  return {
    ok: true,
    dataUrl,
    bytes,
    warned: bytes > WARN_COMPRESSED_BYTES,
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
