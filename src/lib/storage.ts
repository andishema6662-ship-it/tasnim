import { createSeed, mergeSeed } from "./seed";
import type { NewsroomData } from "./types";

export const STORAGE_KEY = "tasnim-newsroom-v1";

export function loadState(): NewsroomData {
  if (typeof window === "undefined") return createSeed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeed();
    const parsed = JSON.parse(raw) as Partial<NewsroomData>;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.stories) || !Array.isArray(parsed.categories)) {
      return createSeed();
    }
    return mergeSeed(parsed);
  } catch {
    return createSeed();
  }
}

export function saveState(data: NewsroomData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
