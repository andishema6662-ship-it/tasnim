import { expect, test } from "@playwright/test";
import { ADMIN_SESSION_KEY } from "../src/lib/admin-auth";

const SHOT = "/cursor/stores/self/media/admin-login-codepen-style/admin-gate-no-session.png";
const BASE = process.env.LIVE_SITE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test("admin root shows login when session cleared", async ({ page }) => {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem("tasnim-gate-test-init")) return;
    sessionStorage.setItem("tasnim-gate-test-init", "1");
    localStorage.removeItem(key);
  }, ADMIN_SESSION_KEY);
  await page.setViewportSize({ width: 1280, height: 840 });
  await page.goto(`${BASE}/admin/`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("admin-login-page").waitFor({ timeout: 30_000 });
  await expect(page).not.toHaveURL(/\/admin\/admin\//);
  await page.screenshot({ path: SHOT, fullPage: true });
});
