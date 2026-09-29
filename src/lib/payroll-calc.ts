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
      const rate = rateFor(story, rates);
      return {
        storyId: story.id,
        title: story.title,
        contentType: rate.contentType,
        label: rate.label,
        amount: rate.amount,
        publishedAt: story.publishedAt ?? story.updatedAt,
      };
    });
  const gross = lines.reduce((sum, line) => sum + line.amount, 0);
  const bonus = lines.length >= 8 ? Math.round(gross * 0.05) : 0;
  const deduction = lines.length < 2 ? 0 : Math.round(gross * 0.02);
  const net = gross + bonus - deduction;
  const monthLabel = start.toLocaleDateString("fa-IR", { year: "numeric", month: "long" });
  return { author: authorName, monthLabel, lines, bonus, deduction, gross, net };
}
