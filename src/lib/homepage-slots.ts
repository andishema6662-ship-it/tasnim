import { categoryName } from "./workflow";
import { publishedStories } from "./site";
import { featuredStory, storiesByCategory } from "./site-portal";
import type { HomepageSlots, NewsroomData, Story, TemplateSettings } from "./types";

export const ALL_CATEGORIES = "";

export function defaultHomepageSlots(): HomepageSlots {
  return {
    hero: { source: "pinned", categoryId: "" },
    featuredSide: { categoryId: "", limit: 3 },
    editorialPicks: { categoryId: "", limit: 6 },
    categoryShowcase: {
      categoryIds: ["cat-sports", "cat-economy", "cat-culture", "cat-society"],
      storiesPerBlock: 4,
    },
    hot: { sort: "views", limit: 8, categoryId: "" },
    photos: { limit: 5, featuredOnly: true },
    multimedia: { enabled: true, limit: 6 },
  };
}

export function resolveHomepageSlots(settings: TemplateSettings): HomepageSlots {
  const base = defaultHomepageSlots();
  const raw = settings.homepageSlots;
  if (!raw) return base;
  return {
    hero: { ...base.hero, ...raw.hero },
    featuredSide: { ...base.featuredSide, ...raw.featuredSide },
    editorialPicks: { ...base.editorialPicks, ...raw.editorialPicks },
    categoryShowcase: {
      categoryIds: raw.categoryShowcase?.categoryIds?.length
        ? raw.categoryShowcase.categoryIds
        : base.categoryShowcase.categoryIds,
      storiesPerBlock: raw.categoryShowcase?.storiesPerBlock ?? base.categoryShowcase.storiesPerBlock,
    },
    hot: { ...base.hot, ...raw.hot },
    photos: { ...base.photos, ...raw.photos },
    multimedia: { ...base.multimedia, ...raw.multimedia },
  };
}

function filterCategory(list: Story[], categoryId: string): Story[] {
  if (!categoryId) return list;
  return list.filter((story) => story.categoryId === categoryId);
}

export function slotHeroStory(data: NewsroomData, slots: HomepageSlots): Story | undefined {
  const published = publishedStories(data);
  if (!published.length) return undefined;
  const { source, categoryId } = slots.hero;
  if (source === "pinned") return featuredStory(data);
  if (source === "latest-category" && categoryId) {
    return published.find((story) => story.categoryId === categoryId);
  }
  return published[0];
}

export function slotFeaturedSideStories(data: NewsroomData, slots: HomepageSlots, heroId?: string): Story[] {
  let list = filterCategory(publishedStories(data), slots.featuredSide.categoryId);
  if (heroId) list = list.filter((story) => story.id !== heroId);
  return list.slice(0, Math.max(1, slots.featuredSide.limit));
}

export function slotEditorialPicks(data: NewsroomData, slots: HomepageSlots): Story[] {
  const list = filterCategory(publishedStories(data), slots.editorialPicks.categoryId);
  return list.slice(0, Math.max(1, slots.editorialPicks.limit));
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
  return slots.categoryShowcase.categoryIds
    .filter((categoryId) => data.categories.some((category) => category.id === categoryId))
    .map((categoryId) => ({
      categoryId,
      label: categoryName(data, categoryId),
      stories: storiesByCategory(data, categoryId, perBlock),
    }));
}

export function slotModernGridLead(data: NewsroomData, slots: HomepageSlots, heroId?: string): Story[] {
  const side = slotFeaturedSideStories(data, slots, heroId);
  if (side.length >= 4) return side.slice(0, 4);
  const published = filterCategory(publishedStories(data), slots.featuredSide.categoryId).filter(
    (story) => story.id !== heroId,
  );
  return published.slice(0, 4);
}
