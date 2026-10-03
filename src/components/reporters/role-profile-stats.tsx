"use client";

import { HexaChartCard, VerticalBarChart } from "@/components/charts/hexadash-charts";
import { faNum } from "@/lib/format";
import type { NewsroomData, User } from "@/lib/types";
import { currentRole } from "@/lib/workflow";

export function ChiefEditorialStatsPanel({ data, user }: { data: NewsroomData; user: User }) {
  const inQueue = data.stories.filter((story) => ["editing", "review", "ready"].includes(story.status)).length;
  const approved = data.stories.filter((story) => story.status === "published" || story.status === "ready").length;
  const pitches = data.pitches.filter((pitch) => pitch.status === "active").length;
  const assigned = data.pitches.filter((pitch) => pitch.assigneeUserId).length;

  return (
    <section className="mt-6 space-y-4" data-testid="chief-profile-stats">
      <h2 className="text-lg font-bold">کارنامه سردبیری — {user.name}</h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="خبر در صف سردبیری" value={inQueue} />
        <Stat label="نسخه تأیید / آماده انتشار" value={approved} />
        <Stat label="سوژه‌های فعال" value={pitches} />
        <Stat label="سوژه‌های ابلاغ‌شده" value={assigned} />
      </dl>
      <HexaChartCard title="وضعیت صف تحریریه" subtitle="بر اساس داده محلی">
        <VerticalBarChart
          items={[
            { label: "ویرایش", value: data.stories.filter((s) => s.status === "editing").length, color: "#5f63f2" },
            { label: "بازبینی", value: data.stories.filter((s) => s.status === "review").length, color: "#8231d3" },
            { label: "آماده", value: data.stories.filter((s) => s.status === "ready").length, color: "#00c875" },
          ]}
        />
      </HexaChartCard>
    </section>
  );
}

export function PublisherOverviewPanel({ data, user }: { data: NewsroomData; user: User }) {
  const published = data.stories.filter((story) => story.status === "published").length;
  const announcements = data.editorialAnnouncements.length;
  const role = currentRole(data);

  return (
    <section className="mt-6 space-y-4" data-testid="publisher-profile-stats">
      <h2 className="text-lg font-bold">کارنامه مدیریت — {user.name}</h2>
      <p className="text-sm text-muted">نقش فعال: {role.name}</p>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="اخبار منتشرشده" value={published} />
        <Stat label="اطلاعیه‌های تحریریه" value={announcements} />
        <Stat label="کاربران فعال" value={data.users.filter((u) => u.active).length} />
        <Stat label="پرونده‌های ویژه" value={data.specialDossiers.length} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-paper px-3 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-bold">{faNum(value)}</dd>
    </div>
  );
}
