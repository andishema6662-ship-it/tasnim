import type { NewsroomData, Story } from "./types";
import { publishedStories } from "./site";
import { categoryName, serviceName } from "./workflow";

export type PortalNavItem =
  | { id: string; label: string; categoryId: string; href?: undefined }
  | { id: string; label: string; href: string; categoryId?: undefined };

export const PORTAL_NAV: PortalNavItem[] = [
  { id: "intl", label: "بین‌الملل", categoryId: "cat-politics" },
  { id: "sports", label: "ورزشی", categoryId: "cat-sports" },
  { id: "economy", label: "اقتصادی", categoryId: "cat-economy" },
  { id: "society", label: "اجتماعی", categoryId: "cat-society" },
  { id: "culture", label: "فرهنگی هنری", categoryId: "cat-culture" },
  { id: "politics", label: "سیاسی", categoryId: "cat-politics" },
  { id: "tech", label: "فناوری", categoryId: "cat-science" },
  { id: "media", label: "فیلم و صوت", href: "/site#multimedia" },
  { id: "photo", label: "گزارش تصویری", href: "/site#photos" },
];

export function featuredStory(data: NewsroomData): Story | undefined {
  const published = publishedStories(data);
  const fromOrder = data.homeOrder.map((id) => published.find((story) => story.id === id)).find(Boolean);
  return fromOrder ?? published[0];
}

export function storiesByCategory(data: NewsroomData, categoryId: string, limit = 6): Story[] {
  return publishedStories(data).filter((story) => story.categoryId === categoryId).slice(0, limit);
}

export function topViewedStories(data: NewsroomData, limit = 8): Story[] {
  return [...publishedStories(data)].sort((a, b) => b.views - a.views).slice(0, limit);
}

export function relatedStories(data: NewsroomData, story: Story, limit = 4): Story[] {
  return publishedStories(data)
    .filter((item) => item.id !== story.id && (item.categoryId === story.categoryId || item.serviceId === story.serviceId))
    .slice(0, limit);
}

export function storyCategoryLabel(data: NewsroomData, story: Story): string {
  return categoryName(data, story.categoryId);
}

export function storyServiceLabel(data: NewsroomData, story: Story): string {
  return serviceName(data, story.serviceId);
}

export function portalBannerAds(data: NewsroomData) {
  return data.ads.filter((ad) => ad.active);
}

export function approvedCommentsForStory(data: NewsroomData, storyId: string) {
  return data.comments.filter((comment) => comment.storyId === storyId && comment.status === "approved");
}

export function portalSiteTitle(data: NewsroomData): string {
  return (data.settings.mediaName ?? "").trim() || data.settings.newsroomName;
}

export function portalSiteSubtitle(data: NewsroomData): string {
  return (data.settings.mediaDisplayTitle ?? "").trim() || data.settings.tagline;
}
