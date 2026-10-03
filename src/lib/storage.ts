import { createSeed, mergeSeed } from "./seed";
import { sanitizeNewsroomData } from "./storage-sanitize";
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
    const merged = mergeSeed(parsed);
    return sanitizeNewsroomData(merged).data;
  } catch {
    return createSeed();
  }
}

export function saveState(data: NewsroomData) {
  if (typeof window === "undefined") return;
  const write = (payload: NewsroomData) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };
  try {
    write(sanitizeNewsroomData(data).data);
  } catch {
    try {
      write(sanitizeNewsroomData(data, "aggressive").data);
    } catch {
      /* quota still exceeded — user must clear site data */
    }
  }
}
