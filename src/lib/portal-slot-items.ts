import type { Feed, FeedItem, NewsroomData, RssSlotRef, Story } from "./types";

export type PortalItem =
  | { type: "story"; story: Story }
  | { type: "external"; id: string; title: string; summary: string; href: string; sourceName: string };

export function emptyRssSlotRef(): RssSlotRef {
  return { feedId: "", inlineTitle: "", inlineUrl: "" };
}

export function resolveFeedForSlot(data: NewsroomData, ref: RssSlotRef): Feed | null {
  if (ref.feedId) {
    const feed = data.feeds.find((item) => item.id === ref.feedId);
    if (feed) return feed;
  }
  const url = ref.inlineUrl.trim();
  if (!url) return null;
  return {
    id: `inline-${url}`,
    title: ref.inlineTitle.trim() || "منبع بیرونی",
    url,
    items: [],
  };
}

export function feedItemsAsPortalItems(feed: Feed, limit: number): PortalItem[] {
  const sourceName = feed.title;
  const href = feed.url || "#";
  return feed.items.slice(0, Math.max(1, limit)).map((item) => ({
    type: "external",
    id: item.id,
    title: item.title,
    summary: item.summary,
    href,
    sourceName,
  }));
}

export function storiesAsPortalItems(stories: Story[]): PortalItem[] {
  return stories.map((story) => ({ type: "story", story }));
}

export function portalItemKey(item: PortalItem): string {
  return item.type === "story" ? item.story.id : item.id;
}

export function firstFeedItemAsHero(feed: Feed): PortalItem | undefined {
  const item = feed.items[0];
  if (!item) return undefined;
  return {
    type: "external",
    id: item.id,
    title: item.title,
    summary: item.summary,
    href: feed.url || "#",
    sourceName: feed.title,
  };
}

export function tickerTextFromFeed(feed: Feed, limit: number): string[] {
  return feed.items.slice(0, limit).map((item) => item.title);
}

export function tickerTextFromFeedItem(item: FeedItem, sourceName: string): string {
  return `${item.title} — منبع: ${sourceName}`;
}
