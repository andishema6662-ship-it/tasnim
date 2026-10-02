"use client";

import Link from "next/link";
import { activeAnnouncementsForUser, deadlineBadge, pinExpiryLabel, urgentTodosForUser } from "@/lib/reporter-workspace";
import { useNewsroom } from "@/lib/store";
import { currentUser } from "@/lib/workflow";
import { formatJalaliDateTime } from "@/lib/jalali";
import { cn } from "../ui";

export function DashboardPinnedAnnouncements() {
  const { data } = useNewsroom();
  const user = currentUser(data);
  if (!user) return null;
  const items = activeAnnouncementsForUser(data, user);

  return (
    <section
      className="flex h-full min-h-[12rem] flex-col rounded-2xl border border-line bg-sheet p-4 shadow-sm"
      data-testid="dashboard-pinned-announcements"
    >
      <h2 className="font-bold text-ink">پیام‌های سنجاق‌شده مدیر</h2>
      <p className="mt-1 text-xs text-muted">اطلاعیه‌های فعال از مدیر مسئول و سردبیر</p>
      <div className="mt-3 flex flex-1 flex-col gap-2">
        {items.length === 0 ? <p className="text-sm text-muted">پیام سنجاق‌شده‌ای نیست.</p> : null}
        {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "rounded-2xl border px-4 py-3 shadow-sm",
            item.priority === "urgent" && "border-red-200 bg-red-50",
            item.priority === "important" && "border-amber-200 bg-amber-50",
            item.priority === "normal" && "border-violet-200 bg-violet-50",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted">سنجاق · {item.authorName}</p>
            <span className="text-[11px] text-muted">{pinExpiryLabel(item.pinnedUntil)}</span>
          </div>
          <h2 className="mt-1 font-bold">{item.title}</h2>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="mt-2 max-h-44 w-full rounded-xl object-cover" data-testid="dashboard-announcement-image" />
          ) : null}
          <p className="mt-1 text-sm leading-7">{item.body}</p>
        </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardDeadlineAlerts() {
  const { data } = useNewsroom();
  const user = currentUser(data);
  if (!user) return null;
  const todos = urgentTodosForUser(data, user.id);
  const urgentAnnouncements = activeAnnouncementsForUser(data, user).filter((a) => a.priority !== "normal");

  return (
    <section
      className="flex h-full min-h-[12rem] flex-col rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm"
      data-testid="dashboard-deadline-alerts"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-amber-950">هشدارهای هوشمند و ضرب‌الاجل‌ها</h2>
          <p className="mt-0.5 text-xs text-amber-900/80">کارهای فوری و یادآوری‌های نزدیک</p>
        </div>
        <Link href="/admin/reporters/my-tasks" className="text-sm font-medium text-primary hover:underline">کارهای من</Link>
      </div>
      <ul className="mt-3 flex-1 space-y-2 text-sm">
        {!todos.length && !urgentAnnouncements.length ? (
          <li className="text-muted">هشدار فعالی نیست.</li>
        ) : null}
        {todos.map((todo) => {
          const badge = deadlineBadge(todo.dueAt, todo.done);
          return (
            <li key={todo.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
              <span className="font-medium">{todo.title}</span>
              <span className="text-xs text-muted">{formatJalaliDateTime(todo.dueAt)}</span>
              {badge ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800" data-testid="dashboard-deadline-badge">
                  {badge.text}
                </span>
              ) : null}
            </li>
          );
        })}
        {urgentAnnouncements.map((item) => (
          <li key={item.id} className="rounded-lg bg-white/70 px-3 py-2">
            <span className="font-semibold text-violet-800">پیام {item.authorName}: </span>
            {item.title}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NotificationPreviewList() {
  const { data } = useNewsroom();
  const user = currentUser(data);
  if (!user) return <p className="p-3 text-sm text-muted">اعلانی نیست.</p>;
  const todos = urgentTodosForUser(data, user.id).slice(0, 3);
  const announcements = activeAnnouncementsForUser(data, user).filter((a) => a.priority !== "normal").slice(0, 3);

  return (
    <div className="max-h-72 overflow-y-auto p-2 text-sm" data-testid="header-notifications">
      {todos.length === 0 && announcements.length === 0 ? <p className="px-2 py-3 text-muted">اعلان فعالی نیست.</p> : null}
      {todos.map((todo) => (
        <Link key={todo.id} href="/admin/reporters/my-tasks" className="block rounded-lg px-2 py-2 hover:bg-sand">
          کار: {todo.title}
        </Link>
      ))}
      {announcements.map((item) => (
        <div key={item.id} className="rounded-lg px-2 py-2 hover:bg-sand">
          <p className="font-semibold">{item.title}</p>
          <p className="text-xs text-muted">{item.authorName}</p>
        </div>
      ))}
      <Link href="/admin" className="mt-2 block px-2 text-xs font-medium text-primary">مشاهده پیشخوان</Link>
    </div>
  );
}
