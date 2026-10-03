import { test } from "@playwright/test";

const LIVE_BASE = process.env.LIVE_SITE_URL ?? "https://diyareminoodari.ir";
const USERS_SHOT = "/cursor/stores/self/media/admin-users-polish/users-page-live.png";

test("capture live users page after login", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(`${LIVE_BASE}/admin/login/`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("admin-login-username").fill("shamsaei");
  await page.getByTestId("admin-login-password").fill("shams1404");
  await page.getByTestId("admin-login-submit").click();
  await page.waitForURL((url) => url.pathname.includes("/admin") && !url.pathname.includes("/login"), {
    timeout: 30_000,
  });
  await page.goto(`${LIVE_BASE}/admin/admin/users/`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("users-table").waitFor({ timeout: 20_000 });
  await page.getByTestId("user-password-suggest").waitFor({ timeout: 20_000 });
  await page.screenshot({ path: USERS_SHOT, fullPage: true });
});
