import type { NewsroomData, Story, StoryGrade } from "./types";

export const STORY_GRADE_LABELS: Record<StoryGrade, string> = {
  1: "درجه ۱ — تحلیلی / اختصاصی / جریان‌ساز",
  2: "درجه ۲ — تولیدی / مصاحبه / پوشش باکیفیت",
  3: "درجه ۳ — تنظیمی / بازنشر / کوتاه",
};

export const DEFAULT_GRADE_TARIFFS: Record<StoryGrade, number> = {
  1: 700_000,
  2: 450_000,
  3: 250_000,
};

export function storyGrade(story: Story): StoryGrade {
  return story.grade ?? 2;
}

export function gradeTariff(data: NewsroomData, grade: StoryGrade): number {
  const fromRates = data.payrollRates?.find((rate) => rate.contentType === `grade-${grade}`);
  if (fromRates) return fromRates.amount;
  return DEFAULT_GRADE_TARIFFS[grade];
}

export function canSetStoryGrade(data: NewsroomData): boolean {
  const role = data.roles.find((item) => item.id === data.currentRoleId);
  return role?.base === "chief" || role?.base === "publisher";
}
