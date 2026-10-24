import type { MediaItem } from "./types";

function svgDataUrl(title: string, w: number, h: number, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="28" font-family="Tahoma,sans-serif">${title}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createSeedMediaLibrary(): MediaItem[] {
  const ts = "2026-09-20T10:00:00.000Z";
  return [
    {
      id: "med-yazd",
      title: "مزرعه خورشیدی مهریز",
      fileName: "yazd-solar.jpg",
      src: svgDataUrl("نیروگاه خورشیدی یزد", 1600, 900, "#c45c26"),
      width: 1600,
      height: 900,
      mimeType: "image/svg+xml",
      createdAt: ts,
      alt: "ردیف پنل‌های خورشیدی در مهریز",
    },
    {
      id: "med-tajrish",
      title: "پیاده‌رو بازار تجریش",
      fileName: "tajrish-walkway.jpg",
      src: svgDataUrl("بازار تجریش", 1200, 800, "#6b5b4f"),
      width: 1200,
      height: 800,
      mimeType: "image/svg+xml",
      createdAt: "2026-09-22T14:30:00.000Z",
      alt: "سنگفرش و رفت‌وآمد عابران",
    },
    {
      id: "med-film",
      title: "سالن هفته فیلم کوتاه",
      fileName: "film-week-hall.jpg",
      src: svgDataUrl("هفته فیلم", 1200, 675, "#2f4a6b"),
      width: 1200,
      height: 675,
      mimeType: "image/svg+xml",
      createdAt: "2026-09-19T18:00:00.000Z",
      alt: "سالن نیمه‌روشن پیش از اکران",
    },
    {
      id: "med-volley",
      title: "تمرین تیم ملی والیبال",
      fileName: "volleyball-practice.jpg",
      src: svgDataUrl("والیبال", 1000, 1000, "#1a6b5c"),
      width: 1000,
      height: 1000,
      mimeType: "image/svg+xml",
      createdAt: "2026-09-24T09:15:00.000Z",
      alt: "ست تمرینی در سالن",
    },
  ];
}
