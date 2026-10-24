import { expect, test } from "@playwright/test";
import { loginToAdmin } from "./admin-login";
import path from "node:path";

const OUT = path.join("/cursor/stores/self/media/admin-menu-fix", "menu-nav-works.png");

test.use({ viewport: { width: 1280, height: 800 } });

test("capture live admin users page after sidebar nav", async ({ page }) => {
  test.setTimeout(120_000);
  await loginToAdmin(page, { username: "shamsaei", password: "shams1404" });
  await page.getByTestId("admin-header-brand").waitFor({ timeout: 30_000 });
  await page.getByRole("button", { name: /مدیریت و کاربران/ }).click();
  await page.locator('aside.sticky a[href*="/admin/admin/users"]').first().click();
  await page.waitForURL(/\/admin\/admin\/users/, { timeout: 30_000 });
  await expect(page.getByTestId("users-table")).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: OUT, fullPage: false });
});
