import { faDate, faNum } from "./format";
import type {
  EditorialAnnouncement,
  NewsroomData,
  ReporterFileEntry,
  ReporterStorageQuota,
  ReporterTodo,
  User,
} from "./types";
import { currentUser } from "./workflow";

export const DEFAULT_QUOTA_BYTES = 2 * 1024 * 1024 * 1024;

export const STICKY_LABELS: Record<string, string> = {
  personal: "شخصی",
  work: "کاری",
  important: "مهم",
  urgent: "فوری",
};

export const STICKY_COLORS: Record<string, string> = {
  personal: "bg-sky-50 border-sky-200",
  work: "bg-violet-50 border-violet-200",
  important: "bg-amber-50 border-amber-200",
  urgent: "bg-rose-50 border-rose-200",
};

export function quotaForUser(data: NewsroomData, userId: string): number {
  return data.reporterStorageQuotas.find((item) => item.userId === userId)?.quotaBytes ?? DEFAULT_QUOTA_BYTES;
}

export function filesForUser(data: NewsroomData, userId: string): ReporterFileEntry[] {
  const owned = data.reporterFiles.filter((file) => file.ownerUserId === userId);
  const shared = data.reporterFiles.filter(
    (file) =>
      file.ownerUserId !== userId &&
      file.sharedWith.some((share) => shareApplies(data, share, userId)),
  );
  return [...owned, ...shared];
}

function shareApplies(data: NewsroomData, share: ReporterFileEntry["sharedWith"][0], userId: string): boolean {
  const user = data.users.find((item) => item.id === userId);
  if (!user) return false;
  if (share.scope === "all_reporters") {
    const role = data.roles.find((item) => item.id === user.roleId);
    return role?.base === "reporter";
  }
  if (share.scope === "management") {
    const role = data.roles.find((item) => item.id === user.roleId);
    return role?.base === "chief" || role?.base === "publisher";
  }
  if (share.scope === "user" && share.userId === userId) return true;
  if (share.scope === "editorial_group" && share.editorialGroup) {
    const person = data.people.find((p) => p.userId === userId || p.name === user.name);
    return person?.kind === share.editorialGroup;
  }
  return false;
}

export function usedBytesForUser(data: NewsroomData, userId: string): number {
  return data.reporterFiles
    .filter((file) => file.kind === "file" && file.ownerUserId === userId)
    .reduce((sum, file) => sum + file.sizeBytes, 0);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${faNum(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${faNum(Math.round(bytes / 1024))} کیلوبایت`;
  if (bytes < 1024 * 1024 * 1024) return `${faNum(Math.round(bytes / (1024 * 1024)))} مگابایت`;
  const gb = Math.round((bytes / (1024 * 1024 * 1024)) * 10) / 10;
  return `${faNum(gb)} گیگابایت`;
}

export function todosForUser(data: NewsroomData, userId: string): ReporterTodo[] {
  return data.reporterTodos
    .filter((todo) => todo.userId === userId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export function msUntilDue(dueAt: string): number {
  return new Date(dueAt).getTime() - Date.now();
}

export function deadlineBadge(dueAt: string, done: boolean): { text: string; tone: "ok" | "warn" | "danger" } | null {
  if (done) return null;
  const ms = msUntilDue(dueAt);
  if (ms < 0) return { text: "گذشته از مهلت", tone: "danger" };
  const hours = ms / (1000 * 60 * 60);
  if (hours < 2) return { text: "کمتر از ۲ ساعت مانده", tone: "danger" };
  if (hours < 24) return { text: "زمان رو به اتمام است!", tone: "warn" };
  const end = new Date(dueAt);
  const today = new Date();
  if (end.toDateString() === today.toDateString()) return { text: "سررسید امروز", tone: "warn" };
  return null;
}

export function announcementTargetsUser(data: NewsroomData, announcement: EditorialAnnouncement, user: User): boolean {
  if (announcement.target.type === "all_reporters") {
    const role = data.roles.find((item) => item.id === user.roleId);
    return role?.base === "reporter" || role?.base === "chief";
  }
  if (announcement.target.type === "user") return announcement.target.userId === user.id;
  if (announcement.target.type === "editorial_group") {
    const person = data.people.find((p) => p.userId === user.id || p.name === user.name);
    return person?.kind === announcement.target.group;
  }
  return false;
}

export function activeAnnouncementsForUser(data: NewsroomData, user: User): EditorialAnnouncement[] {
  const now = Date.now();
  return data.editorialAnnouncements
    .filter((item) => {
      if (!announcementTargetsUser(data, item, user)) return false;
      if (!item.pinnedUntil) return true;
      return new Date(item.pinnedUntil).getTime() > now;
    })
    .sort((a, b) => {
      const prio = { urgent: 0, important: 1, normal: 2 };
      return prio[a.priority] - prio[b.priority] || b.createdAt.localeCompare(a.createdAt);
    });
}

export function urgentTodosForUser(data: NewsroomData, userId: string): ReporterTodo[] {
  return todosForUser(data, userId).filter((todo) => {
    if (todo.done) return false;
    const badge = deadlineBadge(todo.dueAt, todo.done);
    return badge !== null;
  });
}

export function dashboardAlertCount(data: NewsroomData): number {
  const user = currentUser(data);
  if (!user) return 0;
  const todos = urgentTodosForUser(data, user.id).length;
  const announcements = activeAnnouncementsForUser(data, user).filter((a) => a.priority !== "normal").length;
  return todos + announcements;
}

export function pinExpiryLabel(pinnedUntil: string | null): string {
  if (!pinnedUntil) return "همیشگی";
  const ms = new Date(pinnedUntil).getTime() - Date.now();
  if (ms <= 0) return "منقضی شده";
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days <= 1) return `تا ${faDate(pinnedUntil)}`;
  return `${faNum(days)} روز دیگر · ${faDate(pinnedUntil)}`;
}

export function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}
