import type { NewsPitch, NewsroomData, PitchPriority, PitchStatus, Status } from "./types";
import { currentRole, currentUser, statusLabel } from "./workflow";

export const PITCH_STATUS_LABEL: Record<PitchStatus, string> = {
  active: "در حال انجام",
  completed: "تکمیل‌شده",
  cancelled: "لغو شده",
};

export const PITCH_PRIORITY_LABEL: Record<PitchPriority, string> = {
  low: "کم",
  normal: "معمولی",
  high: "بالا",
};

export function canManagePitches(data: NewsroomData): boolean {
  const role = currentRole(data);
  return role.base === "chief" || role.base === "publisher";
}

export function reporterUsers(data: NewsroomData) {
  return data.users.filter((user) => user.active && data.roles.some((role) => role.id === user.roleId && role.base === "reporter"));
}

export function pitchVisibleToUser(data: NewsroomData, pitch: NewsPitch): boolean {
  if (canManagePitches(data)) return true;
  const role = currentRole(data);
  if (role.base !== "reporter") return false;
  const user = currentUser(data);
  if (!user) return false;
  return pitch.audience === "all_reporters" || pitch.assigneeUserId === user.id;
}

export function storiesForPitch(data: NewsroomData, pitchId: string) {
  return data.stories.filter((story) => story.pitchId === pitchId);
}

export function pitchStoryReport(data: NewsroomData, pitchId: string) {
  const linked = storiesForPitch(data, pitchId);
  const breakdown: Partial<Record<Status, number>> = {};
  linked.forEach((story) => {
    breakdown[story.status] = (breakdown[story.status] ?? 0) + 1;
  });
  return {
    total: linked.length,
    breakdown,
    linked,
  };
}

export function pitchReportSummary(data: NewsroomData, pitchId: string): string {
  const { total, breakdown } = pitchStoryReport(data, pitchId);
  if (!total) return "هنوز خبری برای این سوژه ثبت نشده است.";
  const parts = (["draft", "editing", "review", "ready", "published", "archived"] as Status[])
    .filter((status) => (breakdown[status] ?? 0) > 0)
    .map((status) => `${statusLabel(data, status)}: ${breakdown[status]}`);
  return `${total} خبر — ${parts.join(" · ")}`;
}

export function assigneeLabel(data: NewsroomData, pitch: NewsPitch): string {
  if (pitch.audience === "all_reporters") return "همه خبرنگاران";
  const user = data.users.find((item) => item.id === pitch.assigneeUserId);
  return user?.name ?? "خبرنگار مشخص‌نشده";
}
