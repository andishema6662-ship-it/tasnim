import { storyGrade } from "./story-grade";
import type { NewsroomData, Story, StoryGrade, User } from "./types";

export interface WeeklyProductionPoint {
  label: string;
  published: number;
  worked: number;
}

export interface GradeBreakdown {
  grade: StoryGrade;
  count: number;
}

export interface ReporterWorkload {
  totalAssigned: number;
  completed: number;
  percent: number;
  pitchTotal: number;
  pitchDone: number;
  todoTotal: number;
  todoDone: number;
  pitchSuccessPercent: number;
}

function storiesByAuthor(data: NewsroomData, authorName: string): Story[] {
  return data.stories.filter((story) => story.author === authorName);
}

export function weeklyProductionTrend(data: NewsroomData, authorName: string, weeks = 8): WeeklyProductionPoint[] {
  const stories = storiesByAuthor(data, authorName);
  const now = new Date();
  const points: WeeklyProductionPoint[] = [];
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const end = new Date(now);
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const inRange = (story: Story) => {
      const t = new Date(story.updatedAt);
      return t >= start && t <= end;
    };
    const label = start.toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
    points.push({
      label,
      worked: stories.filter(inRange).length,
      published: stories.filter((story) => story.status === "published" && inRange(story)).length,
    });
  }
  return points;
}

export function gradeBreakdownForAuthor(data: NewsroomData, authorName: string): GradeBreakdown[] {
  const stories = storiesByAuthor(data, authorName).filter((story) => story.status !== "draft");
  const counts: Record<StoryGrade, number> = { 1: 0, 2: 0, 3: 0 };
  stories.forEach((story) => {
    counts[storyGrade(story)] += 1;
  });
  return ([1, 2, 3] as StoryGrade[]).map((grade) => ({ grade, count: counts[grade] }));
}

export function reporterWorkload(data: NewsroomData, user: User): ReporterWorkload {
  const pitches = data.pitches.filter(
    (pitch) => pitch.assigneeUserId === user.id || (pitch.audience === "all_reporters" && pitch.status === "active"),
  );
  const pitchTotal = pitches.length;
  const pitchDone = pitches.filter((pitch) => {
    const linked = data.stories.some((story) => story.pitchId === pitch.id && story.status === "published");
    return pitch.status === "completed" || linked;
  }).length;
  const todos = data.reporterTodos.filter((todo) => todo.userId === user.id);
  const todoTotal = todos.length;
  const todoDone = todos.filter((todo) => todo.done).length;
  const totalAssigned = pitchTotal + todoTotal;
  const completed = pitchDone + todoDone;
  const percent = totalAssigned === 0 ? 0 : Math.round((completed / totalAssigned) * 100);
  const pitchSuccessPercent = pitchTotal === 0 ? 0 : Math.round((pitchDone / pitchTotal) * 100);
  return { totalAssigned, completed, percent, pitchTotal, pitchDone, todoTotal, todoDone, pitchSuccessPercent };
}

export function dashboardWeeklyProduction(data: NewsroomData, weeks = 8): WeeklyProductionPoint[] {
  const now = new Date();
  const points: WeeklyProductionPoint[] = [];
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const end = new Date(now);
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const inRange = (story: Story) => {
      const t = new Date(story.updatedAt);
      return t >= start && t <= end;
    };
    points.push({
      label: start.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
      worked: data.stories.filter(inRange).length,
      published: data.stories.filter((story) => story.status === "published" && inRange(story)).length,
    });
  }
  return points;
}

export function dashboardStatusBars(data: NewsroomData): { label: string; value: number }[] {
  return [
    { label: "پیش‌نویس", value: data.stories.filter((s) => s.status === "draft").length },
    { label: "ویرایش", value: data.stories.filter((s) => s.status === "editing").length },
    { label: "بازبینی", value: data.stories.filter((s) => s.status === "review").length },
    { label: "آماده", value: data.stories.filter((s) => s.status === "ready").length },
    { label: "منتشر", value: data.stories.filter((s) => s.status === "published").length },
  ];
}
