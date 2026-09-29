import type { NewsPitch, NewsroomData, Story, User } from "./types";

export interface ReporterPitchStats {
  userId: string;
  name: string;
  pitchesReceived: number;
  storiesProduced: number;
  successRate: number;
  onTimeRate: number;
  lateCount: number;
}

function storiesForAuthor(data: NewsroomData, authorName: string): Story[] {
  return data.stories.filter((story) => story.author === authorName);
}

function pitchesForReporter(data: NewsroomData, user: User): NewsPitch[] {
  return data.pitches.filter((pitch) => {
    if (pitch.audience === "all_reporters") return true;
    return pitch.assigneeUserId === user.id;
  });
}

export function reporterPitchStats(data: NewsroomData): ReporterPitchStats[] {
  const reporters = data.users.filter((user) => data.roles.find((role) => role.id === user.roleId)?.base === "reporter");
  return reporters.map((user) => {
    const pitches = pitchesForReporter(data, user);
    const stories = storiesForAuthor(data, user.name);
    const linked = stories.filter((story) => story.pitchId);
    const successRate = pitches.length ? Math.round((linked.length / pitches.length) * 100) : stories.length ? 100 : 0;
    let onTime = 0;
    let withDeadline = 0;
    pitches.forEach((pitch) => {
      if (!pitch.deadline) return;
      withDeadline += 1;
      const story = stories.find((item) => item.pitchId === pitch.id && item.status === "published");
      if (!story) return;
      if (new Date(story.publishedAt ?? story.updatedAt) <= new Date(pitch.deadline)) onTime += 1;
    });
    const onTimeRate = withDeadline ? Math.round((onTime / withDeadline) * 100) : 100;
    return {
      userId: user.id,
      name: user.name,
      pitchesReceived: pitches.length,
      storiesProduced: stories.filter((s) => s.status === "published" || s.status === "ready").length,
      successRate,
      onTimeRate,
      lateCount: withDeadline - onTime,
    };
  });
}

export type PeriodKind = "30d" | "quarter" | "year";

export function periodStart(kind: PeriodKind, ref = new Date()): Date {
  const d = new Date(ref);
  if (kind === "30d") {
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (kind === "quarter") {
    d.setMonth(d.getMonth() - 3);
    return d;
  }
  d.setFullYear(d.getFullYear() - 1);
  return d;
}

export function storiesInPeriod(data: NewsroomData, authorName: string, kind: PeriodKind): Story[] {
  const start = periodStart(kind).getTime();
  return storiesForAuthor(data, authorName).filter((story) => {
    const t = new Date(story.publishedAt ?? story.updatedAt).getTime();
    return t >= start && (story.status === "published" || story.status === "archived");
  });
}
