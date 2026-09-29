import type { ReporterGrade, SocialChannelConfig } from "./types";

export const REPORTER_GRADE_LABELS: Record<ReporterGrade, string> = {
  trainee: "کارآموز",
  junior: "خبرنگار پایه",
  senior: "ارشد",
  "desk-chief": "دبیر سرویس",
};

export const SOCIAL_CHANNEL_LABELS: Record<SocialChannelConfig["channel"], string> = {
  telegram: "تلگرام",
  bale: "بله",
  eitaa: "ایتا",
  rubika: "روبیکا",
  x: "X (توییتر)",
};
