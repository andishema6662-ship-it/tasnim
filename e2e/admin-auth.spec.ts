import { expect, test } from "@playwright/test";
import { loginToAdmin } from "./admin-login";

test("admin root redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByTestId("admin-login-page")).toBeVisible();
});

test("login grants access to dashboard", async ({ page }) => {
  await loginToAdmin(page, { username: "rezaei" });
  await expect(page.getByRole("heading", { name: "خط تولید خبر" })).toBeVisible({ timeout: 12_000 });
});

test("logout returns to login", async ({ page }) => {
  await loginToAdmin(page, { username: "shamsaei" });
  await page.getByTestId("header-user-name").click();
  await page.getByTestId("admin-logout").click();
  await expect(page).toHaveURL(/\/admin\/login/);
});
