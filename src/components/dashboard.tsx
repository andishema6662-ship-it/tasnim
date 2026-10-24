"use client";

import Link from "next/link";
import { faDate, faNum } from "@/lib/format";
import { groups, hrefFor, modules } from "@/lib/modules";
import { useNewsroom } from "@/lib/store";
import { categoryName, currentRole, STATUSES, statusLabel } from "@/lib/workflow";
import { dashboardStatusBars, dashboardWeeklyProduction } from "@/lib/reporter-performance";
import { DualAreaLineChart, HexaChartCard, HorizontalBarChart } from "./charts/hexadash-charts";
import { DashboardDeadlineAlerts, DashboardPinnedAnnouncements } from "./dashboard/dashboard-alerts";
import { DashboardUpcomingEventsWidget } from "./dashboard/upcoming-events-widget";
import { DashboardAgendaWidget } from "./editorial/contacts-agenda-screens";
import { cn, StatusBadge } from "./ui";

const chartColors = ["#8231d3", "#5f63f2", "#d97706", "#0891b2", "#059669", "#db2777", "#4d7c0f", "#272b41"];

const shortcuts = [
  { href: "/admin/editorial/cartable", label: "کارتابل" },
  { href: "/admin/editorial/cartable?view=queue", label: "صف سردبیری" },
  { href: "/admin/editorial/ai", label: "دستیار تحریریه" },
  { href: "/admin/editorial/order", label: "ترتیب خروجی" },
  { href: "/admin/media/albums", label: "آلبوم‌ها" },
  { href: "/admin/structure/categories", label: "دسته‌ها" },
];

function KpiCard({
  label,
  value,
  hint,
  href,
  iconBg,
  icon,
  trend,
}: {
  label: string;
  value: number;
  hint: string;
  href?: string;
  iconBg: string;
  icon: import("react").ReactNode;
  trend?: string;
}) {
  const body = (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-sheet p-4 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{faNum(value)}</p>
        <p className="mt-1 text-[11px] text-muted">{hint}</p>
        {trend ? <p className="mt-2 text-xs font-semibold text-emerald-600">{trend}</p> : null}
      </div>
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", iconBg)}>{icon}</span>
    </div>
  );
  if (href) {
    return <Link href={href} className="block">{body}</Link>;
  }
  return body;
}

export function Dashboard() {
  const { data } = useNewsroom();
  const role = currentRole(data);
  const recent = [...data.stories].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const waiting = [
    { label: "ارسال تازه‌خبر", value: data.submissions.filter((item) => item.status === "new").length, href: "/admin/editorial/submissions" },
    { label: "پیشنهاد باز", value: data.suggestions.filter((item) => item.status === "pending").length, href: "/admin/editorial/suggestions" },
    { label: "نظر در انتظار", value: data.comments.filter((item) => item.status === "pending").length, href: "/admin/audience/comments" },
  ];

  const reporterCount = data.users.filter((user) => {
    if (!user.active) return false;
    const userRole = data.roles.find((role) => role.id === user.roleId);
    return userRole?.base === "reporter";
  }).length;

  const publishedCount = data.stories.filter((s) => s.status === "published").length;
  const reviewCount = data.stories.filter((s) => s.status === "review" || s.status === "editing").length;
  const chatUnread = data.chatMessages.filter((message) => {
    const me = data.users.find((u) => u.roleId === data.currentRoleId);
    const cursor = data.chatReadCursors.find((item) => item.userId === me?.id && item.threadId === message.threadId);
    return message.senderUserId !== me?.id && message.createdAt > (cursor?.lastReadAt ?? "");
  }).length;

  const pipelineStatuses = STATUSES;
  const chartItems = [
    { label: "تعداد خبرنگاران", value: reporterCount },
    { label: "تعداد اخبار کارشده", value: data.stories.length },
    ...pipelineStatuses.map((status) => ({
      label: statusLabel(data, status),
      value: data.stories.filter((story) => story.status === status).length,
    })),
  ];
  const chartMax = Math.max(...chartItems.map((item) => item.value), 1);
  const weeklyTrend = dashboardWeeklyProduction(data);
  const statusBars = dashboardStatusBars(data);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="rounded-2xl border border-line bg-sheet p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">پیشخوان</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">خط تولید خبر</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          نقش فعلی <span className="font-semibold text-ink">{role.name}</span> است. خبرنگار پیش‌نویس را می‌فرستد، سردبیر بازبینی می‌کند و مدیر مسئول منتشر می‌کند.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" data-testid="dashboard-row-alerts">
        <DashboardPinnedAnnouncements />
        <DashboardDeadlineAlerts />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" data-testid="dashboard-row-agenda-events">
        <DashboardAgendaWidget />
        <DashboardUpcomingEventsWidget />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="اخبار در خط"
          value={data.stories.length}
          hint="همه وضعیت‌ها در کارتابل"
          href="/admin/editorial/cartable"
          iconBg="bg-primary-light text-primary"
          trend={reviewCount > 0 ? `${faNum(reviewCount)} در بازبینی/ویرایش` : undefined}
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          }
        />
        <KpiCard
          label="منتشرشده"
          value={publishedCount}
          hint="خروجی عمومی سایت"
          href="/admin/editorial/cartable?status=published"
          iconBg="bg-emerald-50 text-emerald-600"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7 20h10a2 2 0 0 0 2-2V6l-4-4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
            </svg>
          }
        />
        <KpiCard
          label="خبرنگاران فعال"
          value={reporterCount}
          hint="بر اساس نقش کاربران"
          href="/admin/admin/users"
          iconBg="bg-indigo-50 text-accent-blue"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M16 11c1.7 0 3-1.3 3-3S17.7 5 16 5s-3 1.3-3 3 1.3 3 3 3zM8 11c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zM3 20c0-2.8 2.2-5 5-5h8c2.8 0 5 2.2 5 5" />
            </svg>
          }
        />
        <KpiCard
          label="پیام خوانده‌نشده"
          value={chatUnread}
          hint="گفتگو و پیام‌رسان تحریریه"
          href="/admin/admin/chat"
          iconBg="bg-amber-50 text-amber-600"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16v3a2 2 0 0 1 0 4V19H4v-4a2 2 0 0 0 0-4V8z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2" data-testid="dashboard-hexa-charts">
        <HexaChartCard title="روند هفتگی تولید و انتشار" subtitle="Area / Line — HexaDash">
          <DualAreaLineChart
            labels={weeklyTrend.map((point) => point.label)}
            primary={weeklyTrend.map((point) => point.worked)}
            secondary={weeklyTrend.map((point) => point.published)}
            primaryName="کارشده"
            secondaryName="منتشرشده"
          />
        </HexaChartCard>
        <HexaChartCard title="خط تولید بر اساس وضعیت" subtitle="میله‌ای افقی">
          <HorizontalBarChart items={statusBars.map((item, index) => ({ ...item, color: chartColors[index % chartColors.length] }))} />
        </HexaChartCard>
      </div>

      <section className="rounded-2xl border border-line bg-sheet p-5 shadow-sm" aria-label="نمودار آمار تحریریه">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-ink">نمودار آمار کلی</h2>
            <p className="mt-1 text-xs text-muted">بر پایه داده همین مرورگر؛ با تغییر کارتابل به‌روز می‌شود.</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex min-w-[36rem] items-end justify-between gap-2 sm:min-w-0 sm:gap-3">
            {chartItems.map((item, index) => {
              const height = `${Math.round(Math.max(12, (item.value / chartMax) * 100))}%`;
              return (
                <div key={item.label} className="flex min-w-[4.25rem] flex-1 flex-col items-center gap-1.5">
                  <span className="text-xs font-bold tabular-nums text-ink">{faNum(item.value)}</span>
                  <div className="flex h-36 w-full items-end justify-center sm:h-40">
                    <div
                      className="w-full max-w-[2.75rem] rounded-t-lg shadow-sm transition-[height] sm:max-w-[3.25rem]"
                      style={{ height, backgroundColor: chartColors[index % chartColors.length] }}
                      title={`${item.label}: ${faNum(item.value)}`}
                    />
                  </div>
                  <span className="max-w-[5.5rem] text-center text-[10px] leading-4 text-muted sm:text-xs">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((status) => {
          const count = data.stories.filter((story) => story.status === status).length;
          return (
            <Link
              key={status}
              href={`/admin/editorial/cartable?status=${status}`}
              className="rounded-xl border border-line bg-sheet px-3 py-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <p className="text-2xl font-bold tabular-nums">{faNum(count)}</p>
              <p className="text-xs text-muted">{statusLabel(data, status)}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section className="overflow-hidden rounded-2xl border border-line bg-sheet shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-bold">آخرین خبرها</h2>
            <Link href="/admin/editorial/cartable" className="text-sm font-medium text-primary hover:underline">
              همه خبرها
            </Link>
          </div>
          <ul>
            {recent.map((story) => (
              <li key={story.id} className="border-b border-line px-4 py-3 last:border-0 hover:bg-paper/80">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <StatusBadge status={story.status} label={statusLabel(data, story.status)} />
                  <span>{categoryName(data, story.categoryId)}</span>
                  <span>{story.author}</span>
                  <span>{faDate(story.updatedAt)}</span>
                </div>
                <Link href={`/admin/editorial/cartable/${story.id}`} className="mt-1 block font-semibold leading-7 hover:text-primary">
                  {story.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <aside className="space-y-3">
          <section className="rounded-2xl border border-line bg-sheet p-4 shadow-sm">
            <h2 className="font-bold">در انتظار میز</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {waiting.map((item) => (
                <li key={item.href} className="flex items-center justify-between gap-3">
                  <Link href={item.href} className="hover:text-primary">
                    {item.label}
                  </Link>
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">{faNum(item.value)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-line bg-sheet p-4 shadow-sm">
            <h2 className="font-bold">میانبر</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {shortcuts.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-line bg-sheet p-4 text-sm leading-7 shadow-sm">
            <h2 className="font-bold">گروه‌های منو</h2>
            <ul className="mt-2 space-y-1">
              {groups.map((group) => {
                const first = modules.find((item) => item.group === group.id);
                if (!first) return null;
                return (
                  <li key={group.id}>
                    <Link href={hrefFor(first.group, first.slug)} className="hover:text-primary">
                      {group.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
