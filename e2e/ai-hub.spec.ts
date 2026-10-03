import { test, expect } from "@playwright/test";
import { installAdminAuth } from "./admin-login";

import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("AI hub polish and origin tracker", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  await installAdminAuth(page, data);
  await page.goto("/admin/editorial/ai-hub", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("ai-text-correction-hero")).toBeVisible();

  await page.getByTestId("ai-tab-polish").click();
  await page.getByTestId("ai-polish-input").fill("وزیر گفت که پروژه جدید تا پایان سال اجرا می شود.");
  await page.getByTestId("ai-run-polish").click();
  await expect(page.getByTestId("ai-polish-output")).not.toHaveText("—");

  await page.getByTestId("ai-tab-origin").click();
  await page.getByTestId("ai-origin-input").fill("لایحه حمایت از حمل‌ونقل عمومی");
  await page.getByTestId("ai-run-origin").click();
  await expect(page.getByTestId("ai-origin-table")).toBeVisible();
  await expect(page.getByTestId("ai-origin-table")).toContainText("ایسنا");
});

test("transcription sends draft to cartable", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  const before = data.stories.length;
  await installAdminAuth(page, data);
  await page.goto("/admin/editorial/ai-hub", { waitUntil: "domcontentloaded" });
  await page.getByTestId("ai-tab-transcribe").click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "briefing.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("fake"),
  });
  await expect(page.getByTestId("ai-send-cartable-transcribe")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("ai-send-cartable-transcribe").click();
  await expect(page.getByText(/به کارتابل/i)).toBeVisible({ timeout: 5000 });
  const count = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    const data = JSON.parse(raw) as { stories: unknown[] };
    return data.stories?.length ?? 0;
  }, STORAGE_KEY);
  expect(count).toBeGreaterThan(before);
});
