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

export function publishedCountForPerson(data: NewsroomData, person: Person): number {
  return data.stories.filter((story) => story.status === "published" && story.author === person.name).length;
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
