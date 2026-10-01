"use client";

import Link from "next/link";
import { activeAnnouncementsForUser, deadlineBadge, pinExpiryLabel, urgentTodosForUser } from "@/lib/reporter-workspace";
import { useNewsroom } from "@/lib/store";
import { currentUser } from "@/lib/workflow";
import { faDate } from "@/lib/format";
import { cn } from "../ui";

export function DashboardPinnedAnnouncements() {
  const { data } = useNewsroom();
  const user = currentUser(data);
  if (!user) return null;
  const items = activeAnnouncementsForUser(data, user);
  if (!items.length) return null;

  return (
    <section className="space-y-2" data-testid="dashboard-pinned-announcements">
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
          <p className="mt-1 text-sm leading-7">{item.body}</p>
        </div>
      ))}
    </section>
  );
}

export function DashboardDeadlineAlerts() {
  const { data } = useNewsroom();
  const user = currentUser(data);
  if (!user) return null;
  const todos = urgentTodosForUser(data, user.id);
  const urgentAnnouncements = activeAnnouncementsForUser(data, user).filter((a) => a.priority !== "normal");

  if (!todos.length && !urgentAnnouncements.length) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm" data-testid="dashboard-deadline-alerts">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-amber-950">هشدارهای هوشمند</h2>
        <Link href="/reporters/my-tasks" className="text-sm font-medium text-primary hover:underline">کارهای من</Link>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {todos.map((todo) => {
          const badge = deadlineBadge(todo.dueAt, todo.done);
          return (
            <li key={todo.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
              <span className="font-medium">{todo.title}</span>
              <span className="text-xs text-muted">{faDate(todo.dueAt)}</span>
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
        <Link key={todo.id} href="/reporters/my-tasks" className="block rounded-lg px-2 py-2 hover:bg-sand">
          کار: {todo.title}
        </Link>
      ))}
      {announcements.map((item) => (
        <div key={item.id} className="rounded-lg px-2 py-2 hover:bg-sand">
          <p className="font-semibold">{item.title}</p>
          <p className="text-xs text-muted">{item.authorName}</p>
        </div>
      ))}
      <Link href="/" className="mt-2 block px-2 text-xs font-medium text-primary">مشاهده پیشخوان</Link>
    </div>
  );
}
