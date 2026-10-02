import { groups } from "./modules";

export const ADMIN_BASE = "/admin";

const ADMIN_GROUP_IDS = new Set(groups.map((g) => g.id));

/** Public news portal (no admin shell). */
export function isPublicPortalPath(path: string): boolean {
  if (path === "/" || path === "") return true;
  if (path === "/contact" || path.startsWith("/contact/")) return true;
  if (path === "/people" || path.startsWith("/people/")) return true;
  if (path.startsWith("/album/")) return true;
  if (path.startsWith("/dossier/")) return true;
  if (path === "/site" || path.startsWith("/site/")) return true;
  const segment = path.split("/").filter(Boolean)[0];
  if (!segment) return false;
  if (segment === "admin" || segment === "site") return false;
  if (ADMIN_GROUP_IDS.has(segment as (typeof groups)[number]["id"])) return false;
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 1) return true;
  return false;
}

export function isAdminPanelPath(path: string): boolean {
  return path === ADMIN_BASE || path.startsWith(`${ADMIN_BASE}/`);
}

export function adminModulePath(group: string, slug: string): string {
  return `${ADMIN_BASE}/${group}/${slug}`;
}

export function adminColleaguePath(personId: string): string {
  return `${ADMIN_BASE}/colleague/${personId}`;
}

export function publicStoryPath(storyId: string): string {
  return `/${storyId}`;
}

export function publicHomePath(): string {
  return "/";
}
