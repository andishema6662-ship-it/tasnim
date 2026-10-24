import { expect, test } from "@playwright/test";
import { installAdminAuth } from "./admin-login";

import { createSeed } from "../src/lib/seed";
import { CHAT_THREAD_IT_SUPPORT } from "../src/lib/chat-support";
import { STORAGE_KEY } from "../src/lib/storage";

test("dossier poster upload field and public page", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "chief";
  await installAdminAuth(page, data);
  await page.goto("/admin/structure/dossiers", { waitUntil: "domcontentloaded" });
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
  await page.goto("/dossier/dos-1", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("dossier-page")).toBeVisible();
});

test("event map two-step workflow and route list", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "chief";
  await installAdminAuth(page, data);
  await page.goto("/admin/media/event-map", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("event-map-route-list")).toBeVisible();
  await expect(page.getByTestId("event-map-region-label")).toContainText("نقشه تهران");
  await expect(page.getByTestId("event-map-osm-embed")).toBeVisible();
  await expect(page.getByTestId("event-map-phase-plot")).toBeVisible();
  await expect(page.getByTestId("event-map-undo-point")).toBeVisible();
  await expect(page.getByTestId("event-map-download-gif")).toBeEnabled();
  await expect(page.getByTestId("event-map-points-list")).toBeVisible();
  await expect(page.getByTestId("event-map-canvas").getByText("میدان انقلاب")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("event-map-canvas").getByText("میدان آزادی")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("event-map-animated-preview")).toBeVisible();
  await expect(page.getByTestId("event-map-preview-tiles").locator(".leaflet-tile").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("event-map-embed")).toHaveValue(/data-animated="1"/);
  await page.getByRole("button", { name: "بازگشت به تنظیم نما" }).click();
  await expect(page.getByTestId("event-map-lock-view")).toBeVisible();
});

test("sidebar support opens IT chat thread", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  await installAdminAuth(page, data);
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "خط تولید خبر" })).toBeVisible({ timeout: 12_000 });
  await expect(page.getByTestId("sidebar-editorial-support")).toContainText("پیام‌رسان تحریریه");
  await page.getByTestId("sidebar-support-it-link").click();
  await expect(page).toHaveURL(new RegExp(`/admin/chat\\?thread=${CHAT_THREAD_IT_SUPPORT}`));
  await expect(page.getByTestId("chat-layout")).toBeVisible();
});
