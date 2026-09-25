import { pushActivity } from "./activity";
import type { NewsroomData, Permissions, RoleBase, RoleDef, Status, Story, Transition } from "./types";

export const STATUSES: Status[] = ["draft", "editing", "review", "ready", "published", "archived"];

export const FALLBACK_LABEL: Record<Status, string> = {
  draft: "پیش‌نویس",
  editing: "ویرایش",
  review: "بازبینی",
  ready: "آماده انتشار",
  published: "منتشرشده",
  archived: "آرشیو",
};

export const ACTORS: { id: RoleBase; name: string }[] = [
  { id: "reporter", name: "خبرنگار" },
  { id: "chief", name: "سردبیر" },
  { id: "publisher", name: "مدیر مسئول" },
];

export function currentRole(data: NewsroomData): RoleDef {
  return data.roles.find((role) => role.id === data.currentRoleId) ?? data.roles[0];
}

export function currentUser(data: NewsroomData) {
  const role = currentRole(data);
  return data.users.find((user) => user.roleId === role.id && user.active) ?? data.users.find((user) => user.active) ?? data.users[0];
}

export function statusLabel(data: NewsroomData, status: Status): string {
  return data.steps.find((step) => step.status === status)?.label || FALLBACK_LABEL[status];
}

export function actorLabel(data: NewsroomData, actor: RoleBase): string {
  return data.roles.find((role) => role.id === actor)?.name ?? ACTORS.find((item) => item.id === actor)?.name ?? actor;
}

export function allows(role: RoleDef, transition: Transition): boolean {
  if (!transition.enabled || role.base !== transition.actor) return false;
  if (transition.to === "archived" || transition.from === "archived") return role.permissions.archive;
  if (transition.to === "published") return role.permissions.publish;
  if (transition.actor === "reporter") return role.permissions.write;
  if (transition.actor === "chief") return role.permissions.review;
  return role.permissions.publish || role.permissions.review;
}

export function transitionsFrom(data: NewsroomData, status: Status): Transition[] {
  const role = currentRole(data);
  return data.transitions.filter((transition) => transition.from === status && allows(role, transition));
}

export function canEditStory(data: NewsroomData, status: Status): boolean {
  const role = currentRole(data);
  if (status === "archived") return false;
  if (status === "draft") return role.permissions.write;
  return transitionsFrom(data, status).length > 0;
}

export function canPerm(data: NewsroomData, key: keyof Permissions): boolean {
  return currentRole(data).permissions[key];
}

export function canEditCategory(data: NewsroomData, categoryId: string): boolean {
  const role = currentRole(data);
  const rule = data.access.find((item) => item.roleId === role.id && item.categoryId === categoryId);
  return rule ? rule.edit : true;
}

export function canPublishCategory(data: NewsroomData, categoryId: string): boolean {
  const role = currentRole(data);
  const rule = data.access.find((item) => item.roleId === role.id && item.categoryId === categoryId);
  return rule ? rule.publish : true;
}

export function categoryName(data: NewsroomData, id: string): string {
  return data.categories.find((item) => item.id === id)?.name ?? "بدون دسته";
}

export function serviceName(data: NewsroomData, id: string): string {
  return data.services.find((item) => item.id === id)?.name ?? "بدون سرویس";
}

export function applyStatus(story: Story, to: Status): Story {
  const ts = new Date().toISOString();
  return {
    ...story,
    status: to,
    updatedAt: ts,
    publishedAt: to === "published" ? story.publishedAt || ts : to === "archived" ? story.publishedAt : undefined,
  };
}

export function blankStory(data: NewsroomData): Story {
  const ts = new Date().toISOString();
  const categoryId =
    data.categories.find((category) => canEditCategory(data, category.id))?.id ?? data.categories[0]?.id ?? "";
  return {
    id: "",
    title: "",
    lead: "",
    body: "",
    cover: "sand",
    imagePrompt: "",
    audioScript: "",
    categoryId,
    serviceId: data.services[0]?.id ?? "",
    tags: [],
    status: "draft",
    author: currentUser(data)?.name ?? "",
    views: 0,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function placeStory(data: NewsroomData, story: Story, opts?: { promote?: boolean; log?: string }): NewsroomData {
  const exists = data.stories.some((item) => item.id === story.id);
  const stories = exists ? data.stories.map((item) => (item.id === story.id ? story : item)) : [story, ...data.stories];
  let homeOrder = data.homeOrder.filter((id) => stories.some((item) => item.id === id && item.status === "published"));
  if (story.status === "published") {
    if (opts?.promote) homeOrder = [story.id, ...homeOrder.filter((id) => id !== story.id)];
    else if (!homeOrder.includes(story.id)) homeOrder = [...homeOrder, story.id];
  }
  const next = { ...data, stories, homeOrder };
  return opts?.log ? pushActivity(next, opts.log) : next;
}
