import { test } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { installAdminAuth } from "./admin-login";

const LOGIN_SHOT = "/cursor/stores/self/media/admin-login-codepen-style/login-brand-secure.png";
const USERS_SHOT = "/cursor/stores/self/media/admin-users-polish/users-page.png";

test.describe.configure({ mode: "serial" });

test("capture admin login and users screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 840 });
  await page.goto("/admin/login", { waitUntil: "networkidle" });
  await page.getByTestId("admin-login-page").waitFor();
  await page.screenshot({ path: LOGIN_SHOT, fullPage: true });

  const data = createSeed();
  data.currentRoleId = "publisher";
  data.currentUserId = "u-leila";
  await installAdminAuth(page, data);
  await page.goto("/admin/admin/users", { waitUntil: "networkidle" });
  await page.getByTestId("users-table").waitFor();
  await page.screenshot({ path: USERS_SHOT, fullPage: true });
});
