import { gradeTariff, storyGrade } from "./story-grade";
import type { NewsroomData, PayrollRate, Story } from "./types";

export function storyContentType(story: Story): string {
  if (story.serviceId === "srv-talk") return "interview";
  if (story.serviceId === "srv-multi") return "photo-report";
  if (story.serviceId === "srv-report") return "exclusive-report";
  if (story.tags.some((tag) => tag.includes("یادداشت"))) return "note";
  return "news";
}

export interface PayrollLine {
  storyId: string;
  title: string;
  contentType: string;
  label: string;
  amount: number;
  publishedAt: string;
  grade?: number;
}

export interface MonthlyPayroll {
  author: string;
  monthLabel: string;
  lines: PayrollLine[];
  bonus: number;
  deduction: number;
  gross: number;
  net: number;
}

function rateFor(story: Story, rates: PayrollRate[]): PayrollRate {
  const type = storyContentType(story);
  return rates.find((item) => item.contentType === type) ?? rates[0] ?? { id: "", contentType: type, label: type, amount: 0 };
}

export function monthlyPayrollForAuthor(data: NewsroomData, authorName: string, year: number, month: number): MonthlyPayroll {
  const rates = data.payrollRates ?? [];
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  const lines: PayrollLine[] = data.stories
    .filter((story) => story.author === authorName && story.status === "published")
    .filter((story) => {
      const t = new Date(story.publishedAt ?? story.updatedAt);
      return t >= start && t <= end;
    })
    .map((story) => {
      const grade = storyGrade(story);
      const amount = gradeTariff(data, grade);
      const rate = rateFor(story, rates);
      return {
        storyId: story.id,
        title: story.title,
        contentType: rate.contentType,
        label: `خبر درجه ${grade}`,
        amount,
        publishedAt: story.publishedAt ?? story.updatedAt,
        grade,
      };
    });
  const gross = lines.reduce((sum, line) => sum + line.amount, 0);
  const bonus = lines.length >= 8 ? Math.round(gross * 0.05) : 0;
  const deduction = lines.length < 2 ? 0 : Math.round(gross * 0.02);
  const net = gross + bonus - deduction;
  const monthLabel = start.toLocaleDateString("fa-IR", { year: "numeric", month: "long" });
  return { author: authorName, monthLabel, lines, bonus, deduction, gross, net };
}
