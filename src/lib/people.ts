import type { NewsroomData, Person } from "./types";

export const PERSON_KINDS = [
  "مدیر مسئول",
  "سردبیر",
  "دبیر سرویس",
  "خبرنگار",
  "خبرنگار ارشد",
  "عکاس",
  "عکاس خبری",
  "طراح گرافیک و چندرسانه‌ای",
  "عامل تحریریه",
] as const;

export function storiesForPerson(data: NewsroomData, person: Person) {
  return data.stories.filter((story) => story.author === person.name);
}

export function publishedCountForPerson(data: NewsroomData, person: Person): number {
  return storiesForPerson(data, person).filter((story) => story.status === "published").length;
}

export function workedCountForPerson(data: NewsroomData, person: Person): number {
  return storiesForPerson(data, person).length;
}

export function interviewCountForPerson(data: NewsroomData, person: Person): number {
  if (person.interviewCount != null) return person.interviewCount;
  if (!person.userId) return 0;
  return data.reporterAgenda.filter((item) => item.reporterUserId === person.userId).length;
}

export function personForUser(data: NewsroomData, userId: string, userName: string): Person | undefined {
  return (
    data.people.find((person) => person.userId === userId) ??
    data.people.find((person) => person.name === userName)
  );
}

export function reporterTierStars(tier?: number): string {
  const n = Math.min(5, Math.max(0, tier ?? 0));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function personEditorialRank(person: Person): string {
  return (person.editorialRank ?? "").trim() || person.kind;
}

export function visiblePeople(data: NewsroomData): Person[] {
  return data.people.filter((person) => person.visible);
}

export function filterPeople(people: Person[], query: string, kind: string): Person[] {
  const q = query.trim().toLowerCase();
  return people.filter((person) => {
    if (kind && kind !== "all" && person.kind !== kind) return false;
    if (!q) return true;
    const hay = `${person.name} ${person.title} ${person.bio} ${person.kind}`.toLowerCase();
    return hay.includes(q);
  });
}
