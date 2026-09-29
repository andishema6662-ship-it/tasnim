import { test, expect } from "@playwright/test";
import { defaultHomepageSlots } from "../src/lib/homepage-slots";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";
import { defaultTemplateSettings } from "../src/lib/template";

function seedWithSlots(featuredCategoryId: string) {
  const data = createSeed();
  data.currentRoleId = "publisher";
  data.templateSettings = {
    ...defaultTemplateSettings(),
    homepageSlots: {
      ...defaultHomepageSlots(),
      featuredSide: { categoryId: featuredCategoryId, limit: 3 },
      categoryShowcase: {
        categoryIds: ["cat-politics", "cat-sports", "cat-culture", "cat-society"],
        storiesPerBlock: 4,
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
  data.templateSettings!.homepageSlots!.categoryShowcase!.categoryIds = [
    "cat-politics",
    "cat-sports",
    "cat-culture",
    "cat-society",
  ];
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
