import { plainTextToHtml } from "./format";
import type { NewsroomData, Story } from "./types";

export function isCoverImage(cover: string): boolean {
  return /^data:image\//i.test(cover) || /^https?:/i.test(cover);
}

export function storyBodyHtml(body: string): string {
  if (!body) return "";
  if (body.includes("<")) return body;
  return plainTextToHtml(body);
}

export function publishedStories(data: NewsroomData): Story[] {
  return data.stories
    .filter((story) => story.status === "published")
    .sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
}
