import type { GroupId } from "./modules";
import { hrefFor, modules } from "./modules";

export const NAV_SECTIONS_KEY = "tasnim-nav-sections-v1";

export type NavSectionState = Partial<Record<GroupId, boolean>>;

export function loadNavSections(): NavSectionState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(NAV_SECTIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as NavSectionState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveNavSections(state: NavSectionState) {
  window.localStorage.setItem(NAV_SECTIONS_KEY, JSON.stringify(state));
}

export function activeNavGroup(path: string): GroupId | null {
  for (const item of modules) {
    const href = hrefFor(item.group, item.slug);
    if (path === href || path.startsWith(`${href}/`)) return item.group;
  }
  return null;
}
