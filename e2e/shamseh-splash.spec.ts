import { expect, test } from "@playwright/test";

test("shamseh splash plays then dashboard appears", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("shamseh-splash")).toBeVisible();
  await expect(page.getByRole("heading", { name: "خط تولید خبر" })).toBeVisible({ timeout: 12_000 });
});

test("standalone loader HTML is served", async ({ page }) => {
  const response = await page.goto("/shamseh-intro.html", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByTestId("shamseh-brand-title")).toHaveText("شمسه");
  await expect(page.getByTestId("shamseh-tagline")).toHaveText("سامانه جامع تحریریه خبر");
  await expect(page.locator(".emblem img")).toHaveCount(15);
  await expect(page.locator('img[src*="text-band"]')).toHaveCount(0);
});
