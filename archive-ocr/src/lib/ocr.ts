import Tesseract from 'tesseract.js';

export type OcrProgress = {
  status: string;
  progress: number;
};

function assetBase(): string {
  // Vite/Electron packaged UI is loaded from dist/index.html (relative assets).
  if (typeof window !== 'undefined' && window.location?.protocol === 'file:') {
    return '.';
  }
  return '';
}

export async function runPersianOcr(
  image: string,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  const base = assetBase();
  const worker = await Tesseract.createWorker('fas', 1, {
    logger: (m) => {
      if (onProgress && typeof m.progress === 'number') {
        onProgress({ status: String(m.status ?? ''), progress: m.progress });
      }
    },
    workerPath: `${base}/tesseract/worker.min.js`,
    corePath: `${base}/tesseract/`,
    langPath: `${base}/tessdata`,
    gzip: false,
    workerBlobURL: false,
  });

  try {
    const result = await worker.recognize(image);
    return result.data.text?.trim() ?? '';
  } finally {
    await worker.terminate();
  }
}

/** Lightweight offline fallback when tessdata worker fails (keeps UI usable). */
export function mockOcrStub(fileName: string): string {
  return [
    'بسمه تعالی',
    `عنوان سند: ${fileName}`,
    'متن استخراج‌شده آزمایشی آفلاین — موتور Tesseract فارسی در صورت نصب tessdata فعال می‌شود.',
    'تاریخ: ۱۴۰۳/۰۸/۱۵',
    'شماره نامه: ۱۴۰۳/۱/۱۲۳۴',
  ].join('\n');
}
