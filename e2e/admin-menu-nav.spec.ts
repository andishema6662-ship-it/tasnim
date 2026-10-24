import { expect, test } from "@playwright/test";
import { loginToAdmin } from "./admin-login";

test.use({ viewport: { width: 1280, height: 800 } });

test("sidebar navigates to users module", async ({ page }) => {
  test.setTimeout(90_000);
  await loginToAdmin(page, { username: "shamsaei", password: "shams1404" });
  await page.getByTestId("admin-header-brand").waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: /مدیریت و کاربران/ }).click();
  const usersLink = page.locator('aside.sticky a[href="/admin/admin/users/"], aside.sticky a[href="/admin/admin/users"]').first();
  await usersLink.waitFor({ state: "visible", timeout: 15_000 });
  await usersLink.click();
  await page.waitForURL(/\/admin\/admin\/users/, { timeout: 20_000 });
  await expect(page.getByTestId("users-table")).toBeVisible({ timeout: 20_000 });
});
