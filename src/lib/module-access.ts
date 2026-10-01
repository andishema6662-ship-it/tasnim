import { allModuleKeys, moduleKeyFromParts, modules } from "./modules";
import type { NewsroomData, RoleBase } from "./types";
import { canPerm, currentRole, currentUser } from "./workflow";

export const DASHBOARD_MODULE_KEY = "dashboard";

export function allNavModuleKeys(): string[] {
  return [DASHBOARD_MODULE_KEY, ...allModuleKeys()];
}

function reporterHubKeys(): string[] {
  return [
    "reporters/my-profile",
    "reporters/my-news",
    "reporters/my-payroll",
    "reporters/my-admin-affairs",
    "reporters/my-pitches",
    "reporters/my-agenda",
    "reporters/my-tasks",
    "reporters/my-notes",
    "reporters/file-manager",
  ];
}

function reporterPreset(): string[] {
  return [
    DASHBOARD_MODULE_KEY,
    ...reporterHubKeys(),
    "editorial/ai",
    "editorial/ai-hub",
    "editorial/cartable",
    "editorial/pitches",
    "editorial/submissions",
    "media/library",
    "media/albums",
    "media/videos",
    "template/rss",
    "media/people",
    "audience/comments",
    "audience/forum",
    "admin/chat",
    "admin/comms",
    "admin/official-contacts",
    "editorial/agenda",
  ];
}

function chiefPreset(): string[] {
  return [
    ...reporterPreset(),
    "editorial/process",
    "editorial/order",
    "editorial/suggestions",
    "template/newsletter",
    "template/social",
    "template/email",
    "audience/polls",
    "audience/contact",
    "reports/news-report",
    "reports/views",
    "reports/staff",
    "reports/pitch-performance",
    "reports/payroll",
    "reports/reporter-period",
    "reports/traffic",
    "admin/admin-affairs",
    "admin/announcements",
    "structure/dossiers",
    "media/event-map",
    "structure/categories",
    "structure/services",
    "template/pages",
    "structure/tables",
    "structure/banners",
    "structure/ticker",
    "structure/calendar",
    "structure/ads",
    "template/theme",
    "template/logos",
    "structure/links",
    "template/menus",
    "template/forms",
    "admin/access",
    "admin/roles",
  ];
}

function publisherPreset(): string[] {
  return allNavModuleKeys();
}

export function roleModulePreset(base: RoleBase): string[] {
  if (base === "publisher") return publisherPreset();
  if (base === "chief") return chiefPreset();
  return reporterPreset();
}

export function createDefaultRoleModuleAccess(roles: { id: string; base: RoleBase }[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  roles.forEach((role) => {
    map[role.id] = roleModulePreset(role.base);
  });
  return map;
}

export function effectiveModuleKeys(data: NewsroomData): string[] {
  const user = currentUser(data);
  if (user && Object.prototype.hasOwnProperty.call(data.userModuleAccess, user.id)) {
    return data.userModuleAccess[user.id] ?? [];
  }
  const role = currentRole(data);
  const list = data.roleModuleAccess[role.id];
  if (list?.length) return list;
  return roleModulePreset(role.base);
}

export function canAccessModuleKey(data: NewsroomData, key: string): boolean {
  return effectiveModuleKeys(data).includes(key);
}

export function moduleKeyFromPath(path: string): string | null {
  if (path === "/" || path === "") return DASHBOARD_MODULE_KEY;
  if (path === "/site" || path.startsWith("/site/")) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts.length >= 2) return moduleKeyFromParts(parts[0], parts[1]);
  return null;
}

export function canAccessPath(data: NewsroomData, path: string): boolean {
  if (path === "/people" || path.startsWith("/people/")) return true;
  const key = moduleKeyFromPath(path);
  if (!key) return true;
  if (!modules.some((item) => moduleKeyFromParts(item.group, item.slug) === key)) return true;
  return canAccessModuleKey(data, key);
}

export function canManageModuleAccess(data: NewsroomData): boolean {
  return canPerm(data, "manageUsers");
}

export function mergeRoleModuleAccess(
  base: Record<string, string[]>,
  raw: Record<string, string[]> | undefined,
  roles: { id: string; base: RoleBase }[],
): Record<string, string[]> {
  const all = allNavModuleKeys();
  const next: Record<string, string[]> = { ...base, ...(raw ?? {}) };
  roles.forEach((role) => {
    if (!next[role.id]?.length) next[role.id] = roleModulePreset(role.base);
  });
  const publisher = roles.find((role) => role.id === "publisher" || role.base === "publisher");
  if (publisher) {
    next[publisher.id] = [...new Set([...(next[publisher.id] ?? []), ...all])];
  }
  const known = new Set(all);
  roles.forEach((role) => {
    next[role.id] = (next[role.id] ?? []).filter((key) => known.has(key));
  });
  return next;
}

export function moduleTitleForKey(key: string): string {
  if (key === DASHBOARD_MODULE_KEY) return "پیشخوان";
  const mod = modules.find((item) => moduleKeyFromParts(item.group, item.slug) === key);
  return mod?.title ?? key;
}
