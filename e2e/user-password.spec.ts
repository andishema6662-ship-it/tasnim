import { expect, test } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { installAdminAuth, loginToAdmin } from "./admin-login";

async function logout(page: import("@playwright/test").Page) {
  await page.getByTestId("header-user-name").click();
  await page.getByTestId("admin-logout").click();
  await expect(page).toHaveURL(/\/admin\/login/);
}

test("admin can set user password and user logs in with new password", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  data.currentUserId = "u-leila";
  await installAdminAuth(page, data);
  await page.goto("/admin/admin/users", { waitUntil: "domcontentloaded" });
  await page.getByTestId("user-edit-u-leila").click();
  await page.getByTestId("user-edit-password").fill("newpass99");
  await page.getByTestId("user-edit-password-confirm").fill("newpass99");
  await page.getByRole("button", { name: "ذخیره" }).click();
  await logout(page);
  await loginToAdmin(page, { username: "shamsaei", password: "newpass99" });
  await expect(page.getByRole("heading", { name: "خط تولید خبر" })).toBeVisible({ timeout: 12_000 });
});

test("user can change own password from profile", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  data.currentUserId = "u-sara";
  await installAdminAuth(page, data);
  await page.goto("/admin/reporters/my-profile", { waitUntil: "domcontentloaded" });
  await page.getByTestId("change-password-current").fill("shams1404");
  await page.getByTestId("change-password-new").fill("sara-new1");
  await page.getByTestId("change-password-confirm").fill("sara-new1");
  await page.getByTestId("change-password-submit").click();
  await expect(page.getByTestId("change-password-form")).toContainText("با موفقیت");
  await logout(page);
  await loginToAdmin(page, { username: "sara", password: "sara-new1" });
  await expect(page).not.toHaveURL(/\/admin\/login/);
  await logout(page);
  await page.getByTestId("admin-login-username").fill("sara");
  await page.getByTestId("admin-login-password").fill("shams1404");
  await page.getByTestId("admin-login-submit").click();
  await expect(page.getByTestId("admin-login-page")).toBeVisible();
});
