import { expect, test } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { CHAT_THREAD_IT_SUPPORT } from "../src/lib/chat-support";
import { STORAGE_KEY } from "../src/lib/storage";

test("dossier poster upload field and public page", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "chief";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/structure/dossiers", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("dossier-create-poster-upload-btn")).toBeVisible();
  const tinyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.getByTestId("dossier-create-poster-file").setInputFiles({
    name: "poster.png",
    mimeType: "image/png",
    buffer: tinyPng,
  });
  await expect(page.getByTestId("dossier-create-poster-preview")).toBeVisible();
  await page.goto("/site/dossier/dos-1", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("dossier-page")).toBeVisible();
});

test("event map defaults to Iran with Tehran sample route", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "chief";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/media/event-map", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("event-map-region-label")).toContainText("نقشه ایران");
  await expect(page.getByTestId("event-map-osm-embed")).toBeVisible();
  await expect(page.getByRole("button", { name: "میدان انقلاب" })).toBeVisible();
  await expect(page.getByRole("button", { name: "میدان آزادی" })).toBeVisible();
});

test("sidebar support opens IT chat thread", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "خط تولید خبر" })).toBeVisible({ timeout: 12_000 });
  await expect(page.getByTestId("sidebar-editorial-support")).toContainText("پیام‌رسان تحریریه");
  await page.getByTestId("sidebar-support-it-link").click();
  await expect(page).toHaveURL(new RegExp(`/admin/chat\\?thread=${CHAT_THREAD_IT_SUPPORT}`));
  await expect(page.getByTestId("chat-layout")).toBeVisible();
});
