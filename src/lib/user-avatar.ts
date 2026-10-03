import type { NewsroomData, Person, User } from "./types";
import { personForUser } from "./people";

export function avatarUrlForUser(data: NewsroomData, user: User | undefined): string | undefined {
  if (!user) return undefined;
  if (user.avatar) return user.avatar;
  const person = personForUser(data, user.id, user.name);
  return person?.avatarUrl;
}

export function avatarUrlForPerson(data: NewsroomData, person: Person): string | undefined {
  if (person.userId) {
    const user = data.users.find((item) => item.id === person.userId);
    if (user?.avatar) return user.avatar;
  }
  return person.avatarUrl;
}

export function clearUserAvatar(data: NewsroomData, userId: string): NewsroomData {
  const user = data.users.find((item) => item.id === userId);
  const personMatch = (person: Person) =>
    person.userId === userId || (user ? person.name === user.name : false);
  return {
    ...data,
    users: data.users.map((item) => (item.id === userId ? { ...item, avatar: undefined } : item)),
    people: data.people.map((item) =>
      personMatch(item) ? { ...item, avatarUrl: undefined, userId: item.userId ?? userId } : item,
    ),
  };
}

export function applyUserAvatar(data: NewsroomData, userId: string, avatarUrl: string): NewsroomData {
  const user = data.users.find((item) => item.id === userId);
  const personMatch = (person: Person) =>
    person.userId === userId || (user ? person.name === user.name : false);
  return {
    ...data,
    users: data.users.map((item) => (item.id === userId ? { ...item, avatar: avatarUrl } : item)),
    people: data.people.map((item) =>
      personMatch(item) ? { ...item, avatarUrl, userId: item.userId ?? userId } : item,
    ),
  };
}
