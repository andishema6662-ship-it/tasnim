import type { PitchContentType } from "./types";

export const PITCH_CONTENT_LABELS: Record<PitchContentType, string> = {
  "photo-report": "گزارش تصویری",
  "analytical-note": "یادداشت تحلیلی",
  interview: "مصاحبه و گفتگو",
  "field-report": "گزارش میدانی",
  "press-coverage": "پوشش خبری / نشست",
};

export function serviceIdForPitchContent(type: PitchContentType): string {
  switch (type) {
    case "photo-report":
      return "srv-multi";
    case "analytical-note":
      return "srv-report";
    case "interview":
      return "srv-talk";
    case "field-report":
      return "srv-report";
    case "press-coverage":
      return "srv-urgent";
    default:
      return "srv-urgent";
  }
}
