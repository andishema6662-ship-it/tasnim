import { test } from "@playwright/test";

const NOT_FOUND_SHOT = "/cursor/stores/self/media/not-found-404/404-page.png";
const BASE = process.env.LIVE_SITE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test("capture 404 page screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/this-route-does-not-exist-shamseh/`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("shamseh-404-page").waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3200);
  await page.screenshot({ path: NOT_FOUND_SHOT, fullPage: true });
});
