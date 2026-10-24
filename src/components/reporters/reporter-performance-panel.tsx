"use client";

import {
  DonutChart,
  HexaChartCard,
  HorizontalBarChart,
  ProgressBar,
  VerticalBarChart,
} from "@/components/charts/hexadash-charts";
import { faNum } from "@/lib/format";
import {
  gradeBreakdownForAuthor,
  reporterWorkload,
  weeklyProductionTrend,
} from "@/lib/reporter-performance";
import { STORY_GRADE_LABELS } from "@/lib/story-grade";
import type { NewsroomData, User } from "@/lib/types";

const GRADE_COLORS = ["#8231d3", "#5f63f2", "#94a3b8"];

export function ReporterPerformancePanel({ data, user }: { data: NewsroomData; user: User }) {
  const trend = weeklyProductionTrend(data, user.name);
  const grades = gradeBreakdownForAuthor(data, user.name);
  const workload = reporterWorkload(data, user);

  return (
    <section className="mt-6 space-y-4" data-testid="reporter-performance-panel">
      <h2 className="text-lg font-bold">کارنامه عملکرد</h2>
      <ProgressBar
        percent={workload.percent}
        label={`${faNum(workload.percent)}٪ کارهای سپرده‌شده انجام شده است (${faNum(workload.completed)} از ${faNum(workload.totalAssigned)})`}
        testId="reporter-workload-progress"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <HexaChartCard title="روند تولید محتوا" subtitle="هفتگی — کارشده و منتشرشده" testId="reporter-trend-chart">
          <VerticalBarChart
            items={trend.map((point) => ({
              label: point.label,
              value: point.worked,
              color: "#8231d3",
            }))}
          />
          <p className="mt-2 text-xs text-muted">میله‌ها: تعداد اخبار کارشده در هر هفته</p>
        </HexaChartCard>
        <HexaChartCard title="تفکیک درجه خبر" subtitle="درجه ۱ تا ۳" testId="reporter-grade-chart">
          <DonutChart
            centerLabel={`${faNum(grades.reduce((s, g) => s + g.count, 0))}`}
            items={grades.map((item, index) => ({
              label: STORY_GRADE_LABELS[item.grade].slice(0, 12),
              value: item.count,
              color: GRADE_COLORS[index],
            }))}
          />
        </HexaChartCard>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <HexaChartCard title="انجام کارهای سپرده‌شده">
          <DonutChart
            items={[
              { label: "انجام‌شده", value: workload.completed, color: "#00c875" },
              { label: "باقی‌مانده", value: Math.max(0, workload.totalAssigned - workload.completed), color: "#e2e8f0" },
            ]}
            centerLabel={`${faNum(workload.percent)}٪`}
          />
        </HexaChartCard>
        <HexaChartCard title="موفقیت در پوشش سوژه‌ها">
          <HorizontalBarChart
            items={[
              { label: "سوژه پوشش داده‌شده", value: workload.pitchDone, color: "#5f63f2" },
              { label: "سوژه باز", value: Math.max(0, workload.pitchTotal - workload.pitchDone), color: "#cbd5e1" },
            ]}
          />
          <p className="mt-2 text-sm font-semibold text-primary">{faNum(workload.pitchSuccessPercent)}٪ موفقیت سوژه</p>
        </HexaChartCard>
      </div>
    </section>
  );
}
