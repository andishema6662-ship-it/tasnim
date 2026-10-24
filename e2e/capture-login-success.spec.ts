import { expect, test } from "@playwright/test";
import { ADMIN_SESSION_KEY } from "../src/lib/admin-auth";

const SUCCESS_SHOT = "/cursor/stores/self/media/admin-login-codepen-style/login-success.png";
const GATE_SHOT = "/cursor/stores/self/media/admin-login-codepen-style/admin-gate-no-session.png";
const BASE = process.env.LIVE_SITE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test.describe.configure({ mode: "serial" });

test("guest gate then login success", async ({ page }) => {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem("tasnim-gate-test-init")) return;
    sessionStorage.setItem("tasnim-gate-test-init", "1");
    localStorage.removeItem(key);
  }, ADMIN_SESSION_KEY);
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(`${BASE}/admin/`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("admin-login-page").waitFor({ timeout: 30_000 });
  await page.screenshot({ path: GATE_SHOT, fullPage: true });

  await page.getByTestId("admin-login-username").fill("shamsaei");
  await page.getByTestId("admin-login-password").fill("shams1404");
  await page.getByTestId("admin-login-submit").click();
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"), { timeout: 30_000 });
  await page.getByTestId("admin-header-brand").waitFor({ timeout: 30_000 });
  await page.screenshot({ path: SUCCESS_SHOT, fullPage: true });
  const session = await page.evaluate((key) => localStorage.getItem(key), ADMIN_SESSION_KEY);
  expect(session).toContain("shamsaei");
});
