import { test, expect } from "@playwright/test";
import { defaultHomepageSlots } from "../src/lib/homepage-slots";
import { emptyRssSlotRef } from "../src/lib/portal-slot-items";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";
import { defaultTemplateSettings } from "../src/lib/template";

function seedWithSlots(featuredCategoryId: string) {
  const data = createSeed();
  data.currentRoleId = "publisher";
  const slots = defaultHomepageSlots();
  data.templateSettings = {
    ...defaultTemplateSettings(),
    homepageSlots: {
      ...slots,
      featuredSide: {
        contentKind: "internal",
        categoryId: featuredCategoryId,
        limit: 3,
        rss: emptyRssSlotRef(),
      },
    },
  };
  return data;
}

test("featured side grid shows stories from selected category", async ({ page }) => {
  const payload = JSON.stringify(seedWithSlots("cat-culture"));
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, payload],
  );
  await page.goto("/site", { waitUntil: "domcontentloaded" });
  const side = page.getByTestId("portal-featured-side");
  await expect(side.getByRole("link", { name: /خانه هنرمندان/ })).toBeVisible();
  await expect(side.getByRole("link", { name: /مجموعه ورزشی انقلاب کرج/ })).toHaveCount(0);
});

test("category showcase block lists configured category", async ({ page }) => {
  const data = seedWithSlots("");
  const slots = defaultHomepageSlots();
  data.templateSettings = {
    ...defaultTemplateSettings(),
    homepageSlots: {
      ...slots,
      categoryShowcase: {
        ...slots.categoryShowcase,
        blocks: [
          { kind: "internal", categoryId: "cat-politics", rss: emptyRssSlotRef() },
          ...slots.categoryShowcase.blocks.slice(1),
        ],
      },
    },
  };
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/site", { waitUntil: "domcontentloaded" });
  const politics = page.getByTestId("portal-category-block-cat-politics");
  await expect(politics).toContainText("سیاست");
  await expect(politics.getByRole("link", { name: /لایحه حمایت از حمل‌ونقل/ })).toBeVisible();
});

test("hero uses RSS feed when configured", async ({ page }) => {
  const data = seedWithSlots("");
  const slots = defaultHomepageSlots();
  data.templateSettings = {
    ...defaultTemplateSettings(),
    homepageSlots: {
      ...slots,
      hero: {
        contentKind: "rss",
        source: "pinned",
        categoryId: "",
        rss: { feedId: "feed-science", inlineTitle: "", inlineUrl: "" },
      },
    },
  };
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/site", { waitUntil: "domcontentloaded" });
  const hero = page.getByTestId("portal-hero");
  await expect(hero.getByText(/آزمایش میدانی شبکه لرزه‌نگاری/)).toBeVisible();
  await expect(hero.getByText(/منبع:/)).toBeVisible();
});

test("portal branding title appears in header", async ({ page }) => {
  const data = seedWithSlots("");
  data.templateSettings = {
    ...defaultTemplateSettings(),
    portalBranding: {
      mediaName: "خبرگزاری آزمایشی",
      mediaDisplayTitle: "تیتر نمایشی",
      brandMark: "",
    },
  };
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/site", { waitUntil: "domcontentloaded" });
  const brand = page.getByTestId("portal-site-brand");
  await expect(brand).toContainText("خبرگزاری آزمایشی");
  await expect(brand).toContainText("تیتر نمایشی");
});

test("ticker shows category headlines", async ({ page }) => {
  const data = seedWithSlots("");
  const slots = defaultHomepageSlots();
  data.templateSettings = {
    ...defaultTemplateSettings(),
    homepageSlots: {
      ...slots,
      ticker: {
        ...slots.ticker,
        enabled: true,
        source: "category",
        categoryId: "cat-politics",
        includeManual: false,
        limit: 5,
      },
    },
  };
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/site", { waitUntil: "domcontentloaded" });
  const ticker = page.getByTestId("portal-ticker");
  await expect(ticker).toContainText("لایحه حمایت از حمل‌ونقل");
});
