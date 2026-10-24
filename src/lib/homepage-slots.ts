import {
  emptyRssSlotRef,
  feedItemsAsPortalItems,
  firstFeedItemAsHero,
  resolveFeedForSlot,
  storiesAsPortalItems,
  type PortalItem,
} from "./portal-slot-items";
import { publishedStories } from "./site";
import { featuredStory, storiesByCategory } from "./site-portal";
import type {
  CategoryShowcaseBlock,
  HomepageSlots,
  HomepageTickerSlot,
  NewsroomData,
  RssSlotRef,
  Story,
  TemplateSettings,
} from "./types";
import { categoryName } from "./workflow";

export const ALL_CATEGORIES = "";

export function defaultHomepageSlots(): HomepageSlots {
  const rss = emptyRssSlotRef();
  return {
    hero: { contentKind: "internal", source: "pinned", categoryId: "", rss },
    featuredSide: { contentKind: "internal", categoryId: "", limit: 3, rss },
    editorialPicks: { contentKind: "internal", categoryId: "", limit: 6, rss },
    categoryShowcase: {
      blocks: [
        { kind: "internal", categoryId: "cat-sports", rss: emptyRssSlotRef() },
        { kind: "internal", categoryId: "cat-economy", rss: emptyRssSlotRef() },
        { kind: "internal", categoryId: "cat-culture", rss: emptyRssSlotRef() },
        { kind: "internal", categoryId: "cat-society", rss: emptyRssSlotRef() },
      ],
      storiesPerBlock: 4,
    },
    hot: { sort: "views", limit: 8, categoryId: "" },
    photos: { limit: 5, featuredOnly: true },
    multimedia: { enabled: true, limit: 6 },
    ticker: {
      enabled: true,
      label: "فوری",
      source: "mixed",
      categoryId: "",
      serviceId: "",
      tag: "",
      rss: emptyRssSlotRef(),
      includeManual: true,
      limit: 12,
    },
  };
}

function migrateShowcaseBlocks(raw: HomepageSlots | undefined, base: HomepageSlots): CategoryShowcaseBlock[] {
  if (raw?.categoryShowcase?.blocks?.length) {
    return raw.categoryShowcase.blocks.map((block) => ({
      kind: block.kind ?? "internal",
      categoryId: block.categoryId ?? "",
      rss: { ...emptyRssSlotRef(), ...block.rss },
    }));
  }
  const legacyIds =
    (raw as { categoryShowcase?: { categoryIds?: string[] } })?.categoryShowcase?.categoryIds ??
    base.categoryShowcase.blocks.map((block) => block.categoryId);
  return legacyIds.map((categoryId) => ({
    kind: "internal" as const,
    categoryId,
    rss: emptyRssSlotRef(),
  }));
}

function mergeRssSlot(partial?: RssSlotRef) {
  return { ...emptyRssSlotRef(), ...partial };
}

export function resolveHomepageSlots(settings: TemplateSettings): HomepageSlots {
  const base = defaultHomepageSlots();
  const raw = settings.homepageSlots;
  if (!raw) return base;
  const tickerRaw = raw.ticker;
  const ticker: HomepageTickerSlot = {
    ...base.ticker,
    ...tickerRaw,
    rss: mergeRssSlot(tickerRaw?.rss),
    enabled: tickerRaw?.enabled ?? settings.showBreakingTicker ?? base.ticker.enabled,
    label: tickerRaw?.label ?? settings.tickerLabel ?? base.ticker.label,
  };
  return {
    hero: {
      ...base.hero,
      ...raw.hero,
      rss: mergeRssSlot(raw.hero?.rss),
      contentKind: raw.hero?.contentKind ?? base.hero.contentKind,
    },
    featuredSide: {
      ...base.featuredSide,
      ...raw.featuredSide,
      rss: mergeRssSlot(raw.featuredSide?.rss),
      contentKind: raw.featuredSide?.contentKind ?? base.featuredSide.contentKind,
    },
    editorialPicks: {
      ...base.editorialPicks,
      ...raw.editorialPicks,
      rss: mergeRssSlot(raw.editorialPicks?.rss),
      contentKind: raw.editorialPicks?.contentKind ?? base.editorialPicks.contentKind,
    },
    categoryShowcase: {
      blocks: migrateShowcaseBlocks(raw, base),
      storiesPerBlock: raw.categoryShowcase?.storiesPerBlock ?? base.categoryShowcase.storiesPerBlock,
    },
    hot: { ...base.hot, ...raw.hot },
    photos: { ...base.photos, ...raw.photos },
    multimedia: { ...base.multimedia, ...raw.multimedia },
    ticker,
  };
}

function filterCategory(list: Story[], categoryId: string): Story[] {
  if (!categoryId) return list;
  return list.filter((story) => story.categoryId === categoryId);
}

export function slotHeroItem(data: NewsroomData, slots: HomepageSlots): PortalItem | undefined {
  if (slots.hero.contentKind === "rss") {
    const feed = resolveFeedForSlot(data, slots.hero.rss);
    if (!feed) return undefined;
    return firstFeedItemAsHero(feed);
  }
  const published = publishedStories(data);
  if (!published.length) return undefined;
  const { source, categoryId } = slots.hero;
  let story: Story | undefined;
  if (source === "pinned") story = featuredStory(data);
  else if (source === "latest-category" && categoryId) {
    story = published.find((item) => item.categoryId === categoryId);
  } else story = published[0];
  return story ? { type: "story", story } : undefined;
}

export function slotFeaturedSideItems(data: NewsroomData, slots: HomepageSlots, hero?: PortalItem): PortalItem[] {
  const heroStoryId = hero?.type === "story" ? hero.story.id : undefined;
  if (slots.featuredSide.contentKind === "rss") {
    const feed = resolveFeedForSlot(data, slots.featuredSide.rss);
    if (!feed) return [];
    return feedItemsAsPortalItems(feed, slots.featuredSide.limit);
  }
  let list = filterCategory(publishedStories(data), slots.featuredSide.categoryId);
  if (heroStoryId) list = list.filter((story) => story.id !== heroStoryId);
  return storiesAsPortalItems(list.slice(0, Math.max(1, slots.featuredSide.limit)));
}

export function slotEditorialItems(data: NewsroomData, slots: HomepageSlots): PortalItem[] {
  if (slots.editorialPicks.contentKind === "rss") {
    const feed = resolveFeedForSlot(data, slots.editorialPicks.rss);
    if (!feed) return [];
    return feedItemsAsPortalItems(feed, slots.editorialPicks.limit);
  }
  const list = filterCategory(publishedStories(data), slots.editorialPicks.categoryId);
  return storiesAsPortalItems(list.slice(0, Math.max(1, slots.editorialPicks.limit)));
}

export function slotHotStories(data: NewsroomData, slots: HomepageSlots): Story[] {
  let list = filterCategory(publishedStories(data), slots.hot.categoryId);
  const limit = Math.max(1, slots.hot.limit);
  if (slots.hot.sort === "views") {
    return [...list].sort((a, b) => b.views - a.views).slice(0, limit);
  }
  if (slots.hot.sort === "home-order") {
    const ordered = data.homeOrder
      .map((id) => list.find((story) => story.id === id))
      .filter((story): story is Story => Boolean(story));
    const rest = list.filter((story) => !data.homeOrder.includes(story.id));
    return [...ordered, ...rest].slice(0, limit);
  }
  return list.slice(0, limit);
}

export function slotCategoryShowcaseBlocks(data: NewsroomData, slots: HomepageSlots) {
  const perBlock = Math.max(1, slots.categoryShowcase.storiesPerBlock);
  return slots.categoryShowcase.blocks
    .map((block) => {
      if (block.kind === "rss") {
        const feed = resolveFeedForSlot(data, block.rss);
        if (!feed) {
          return { key: `rss-empty-${block.rss.feedId}`, label: "منبع بیرونی", items: [] as PortalItem[] };
        }
        return {
          key: `rss-${feed.id}`,
          label: feed.title,
          items: feedItemsAsPortalItems(feed, perBlock),
        };
      }
      if (!data.categories.some((category) => category.id === block.categoryId)) return null;
      return {
        key: block.categoryId,
        label: categoryName(data, block.categoryId),
        items: storiesAsPortalItems(storiesByCategory(data, block.categoryId, perBlock)),
      };
    })
    .filter((block): block is NonNullable<typeof block> => Boolean(block));
}

export function slotModernGridLeadItems(data: NewsroomData, slots: HomepageSlots, hero?: PortalItem): PortalItem[] {
  const side = slotFeaturedSideItems(data, slots, hero);
  if (side.length >= 4) return side.slice(0, 4);
  if (slots.featuredSide.contentKind === "rss") return side;
  const heroStoryId = hero?.type === "story" ? hero.story.id : undefined;
  const published = filterCategory(publishedStories(data), slots.featuredSide.categoryId).filter(
    (story) => story.id !== heroStoryId,
  );
  return storiesAsPortalItems(published.slice(0, 4));
}

export function resolveTickerLines(data: NewsroomData, settings: TemplateSettings): string[] {
  const slots = resolveHomepageSlots(settings);
  const ticker = slots.ticker;
  if (!ticker.enabled) return [];

  const manual = data.tickers.filter((item) => item.active).map((item) => item.text);
  const limit = Math.max(1, ticker.limit);

  if (ticker.source === "manual") {
    return manual.slice(0, limit);
  }

  if (ticker.source === "rss") {
    const feed = resolveFeedForSlot(data, ticker.rss);
    if (!feed) return manual.slice(0, limit);
    const fromFeed = feed.items.slice(0, limit).map((item) => `${item.title} — منبع: ${feed.title}`);
    return fromFeed.length ? fromFeed : manual;
  }

  let stories = publishedStories(data);
  if (ticker.categoryId) stories = stories.filter((story) => story.categoryId === ticker.categoryId);
  if (ticker.serviceId) stories = stories.filter((story) => story.serviceId === ticker.serviceId);
  if (ticker.tag.trim()) {
    const tag = ticker.tag.trim();
    stories = stories.filter((story) => story.tags.some((item) => item.includes(tag)));
  }
  const fromStories = stories.slice(0, limit).map((story) => story.title);

  if (ticker.source === "category" || ticker.source === "tag" || ticker.source === "service") {
    return fromStories.length ? fromStories : manual;
  }

  if (ticker.source === "mixed") {
    const merged = ticker.includeManual ? [...manual, ...fromStories] : fromStories;
    return merged.slice(0, limit);
  }

  return manual;
}

export function tickerLabelResolved(settings: TemplateSettings): string {
  return resolveHomepageSlots(settings).ticker.label || settings.tickerLabel || "فوری";
}

export function tickerEnabledResolved(settings: TemplateSettings): boolean {
  return resolveHomepageSlots(settings).ticker.enabled;
}

// Legacy helpers for story-only consumers
export function slotHeroStory(data: NewsroomData, slots: HomepageSlots): Story | undefined {
  const item = slotHeroItem(data, slots);
  return item?.type === "story" ? item.story : undefined;
}

export function slotFeaturedSideStories(data: NewsroomData, slots: HomepageSlots, heroId?: string): Story[] {
  const hero: PortalItem | undefined = heroId ? { type: "story", story: { id: heroId } as Story } : undefined;
  return slotFeaturedSideItems(data, slots, hero)
    .filter((item): item is { type: "story"; story: Story } => item.type === "story")
    .map((item) => item.story);
}

export function slotEditorialPicks(data: NewsroomData, slots: HomepageSlots): Story[] {
  return slotEditorialItems(data, slots)
    .filter((item): item is { type: "story"; story: Story } => item.type === "story")
    .map((item) => item.story);
}
