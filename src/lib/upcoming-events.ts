import { formatJalaliDateTime } from "./jalali";
import type { EditorialUpcomingEvent, NewsroomData, UpcomingEventRange, UpcomingEventStatus } from "./types";
import { currentRole } from "./workflow";

export const UPCOMING_EVENT_KIND_LABELS: Record<EditorialUpcomingEvent["kind"], string> = {
  "press-brief": "نشست خبری",
  exhibition: "نمایشگاه",
  conference: "همایش / کنفرانس",
  other: "رویداد دیگر",
};

export const UPCOMING_EVENT_RANGE_LABELS: Record<UpcomingEventRange, string> = {
  week: "هفتگی",
  month: "ماهانه",
  year: "سالیانه",
};

function rangeEnd(range: UpcomingEventRange, from = new Date()): Date {
  const end = new Date(from);
  if (range === "week") end.setDate(end.getDate() + 7);
  else if (range === "month") end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function canApproveUpcomingEvents(data: NewsroomData): boolean {
  const role = currentRole(data);
  return role.base === "chief" || role.base === "publisher";
}

export function upcomingEventsForDashboard(
  data: NewsroomData,
  range: UpcomingEventRange,
  limit = 10,
): EditorialUpcomingEvent[] {
  const now = new Date();
  const end = rangeEnd(range, now);
  return (data.upcomingEvents ?? [])
    .filter((event) => event.status === "approved")
    .filter((event) => {
      const start = new Date(event.startsAt);
      return start >= now && start <= end;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, limit);
}

export function pendingUpcomingEvents(data: NewsroomData): EditorialUpcomingEvent[] {
  return (data.upcomingEvents ?? [])
    .filter((event) => event.status === "pending")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function formatUpcomingEventWhen(iso: string): string {
  return formatJalaliDateTime(iso);
}

export function initialEventStatus(data: NewsroomData): UpcomingEventStatus {
  return canApproveUpcomingEvents(data) ? "approved" : "pending";
}
