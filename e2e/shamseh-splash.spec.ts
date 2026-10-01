import { expect, test } from "@playwright/test";

test("shamseh splash plays then dashboard appears", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("shamseh-splash")).toBeVisible();
  await expect(page.getByRole("heading", { name: "خط تولید خبر" })).toBeVisible({ timeout: 12_000 });
});

test("standalone loader HTML is served", async ({ page }) => {
  const response = await page.goto("/shamseh-intro.html", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("سامانه جامع تحریریه خبر شمسه");
});
