import { faNum } from "./format";
import type { NewsroomData, ReporterAgendaItem, User } from "./types";

export function reporterName(data: NewsroomData, userId: string): string {
  return data.users.find((user) => user.id === userId)?.name ?? userId;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function relativeDayLabel(iso: string, ref = new Date()): "today" | "tomorrow" | "later" {
  const start = new Date(iso);
  const today = dayKey(ref);
  const tomorrow = dayKey(new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1));
  const key = dayKey(start);
  if (key === today) return "today";
  if (key === tomorrow) return "tomorrow";
  return "later";
}

export function formatAgendaTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}

export function formatAgendaReminder(item: ReporterAgendaItem, data: NewsroomData, ref = new Date()): string {
  const rel = relativeDayLabel(item.startAt, ref);
  const time = formatAgendaTime(item.startAt);
  const day =
    rel === "today" ? "امروز" : rel === "tomorrow" ? "فردا" : new Date(item.startAt).toLocaleDateString("fa-IR", { weekday: "long", month: "short", day: "numeric" });
  const place = item.location ? ` در ${item.location}` : "";
  return `${day} ساعت ${time} — ${item.title}${place}`;
}

export function upcomingAgendaItems(data: NewsroomData, opts?: { userId?: string; includeDone?: boolean; horizonDays?: number }) {
  const horizon = opts?.horizonDays ?? 3;
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + horizon);
  end.setHours(23, 59, 59, 999);
  return (data.reporterAgenda ?? [])
    .filter((item) => {
      if (!opts?.includeDone && item.done) return false;
      if (opts?.userId && item.reporterUserId !== opts.userId) return false;
      const start = new Date(item.startAt);
      return start >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && start <= end;
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function agendaVisibleToUser(data: NewsroomData, item: ReporterAgendaItem, user: User): boolean {
  const role = data.roles.find((r) => r.id === user.roleId);
  if (role?.base === "chief" || role?.base === "publisher") return true;
  return item.reporterUserId === user.id;
}
