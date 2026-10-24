import type { NewsroomData, Person, User } from "./types";
import { personForUser } from "./people";
import type { RoleBase } from "./types";

export function roleKindLabel(base: RoleBase): string {
  if (base === "publisher") return "مدیر مسئول";
  if (base === "chief") return "سردبیر";
  return "خبرنگار";
}

export function defaultTitleForUser(data: NewsroomData, user: User): string {
  const role = data.roles.find((item) => item.id === user.roleId);
  return role?.name ?? user.name;
}

export function ensurePersonForUser(data: NewsroomData, user: User): Person {
  const existing = personForUser(data, user.id, user.name);
  if (existing) return existing;
  const role = data.roles.find((item) => item.id === user.roleId);
  const base = role?.base ?? "reporter";
  return {
    id: `p-user-${user.id}`,
    name: user.name,
    title: defaultTitleForUser(data, user),
    bio: "",
    kind: roleKindLabel(base),
    visible: true,
    editorialRank: "",
    joinedAt: new Date().toISOString(),
    userId: user.id,
    phone: "",
    email: "",
    desk: "",
  };
}

export function upsertPersonForUser(data: NewsroomData, user: User, person: Person): NewsroomData {
  const has = data.people.some((item) => item.id === person.id || item.userId === user.id);
  if (has) {
    return {
      ...data,
      people: data.people.map((item) =>
        item.id === person.id || item.userId === user.id ? { ...person, userId: user.id } : item,
      ),
    };
  }
  return { ...data, people: [...data.people, { ...person, userId: user.id }] };
}

export type PersonContactPatch = Pick<Person, "bio" | "phone" | "email" | "desk" | "title">;

export function applyPersonContact(data: NewsroomData, user: User, patch: PersonContactPatch): NewsroomData {
  const base = ensurePersonForUser(data, user);
  const next: Person = {
    ...base,
    bio: patch.bio.trim(),
    phone: patch.phone?.trim() ?? "",
    email: patch.email?.trim() ?? "",
    desk: patch.desk?.trim() ?? "",
    title: patch.title?.trim() || base.title,
  };
  return upsertPersonForUser(data, user, next);
}
