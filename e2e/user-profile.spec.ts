import { expect, test } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("chief profile shows علیرضا رضایی and editorial stats", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "chief";
  data.currentUserId = "u-kamran";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/reporters/my-profile", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("person-profile-name")).toHaveText("علیرضا رضایی");
  await expect(page.getByTestId("chief-profile-stats")).toBeVisible();
});

test("publisher profile shows محمدحسین شمسایی", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  data.currentUserId = "u-leila";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/reporters/my-profile", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("person-profile-name")).toHaveText("محمدحسین شمسایی");
  await expect(page.getByTestId("publisher-profile-stats")).toBeVisible();
});

test("reporter profile and header link", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  data.currentUserId = "u-sara";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "خط تولید خبر" })).toBeVisible({ timeout: 12_000 });
  await page.getByTestId("header-user-name").click();
  await page.getByTestId("header-profile-link").click();
  await expect(page).toHaveURL(/\/admin\/reporters\/my-profile/);
  await expect(page.getByTestId("person-profile-name")).toHaveText("سارا محمدی");
  await expect(page.getByTestId("reporter-performance-panel")).toBeVisible();
});

test("user menu switches reporter to مهدی پوریا", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  data.currentUserId = "u-sara";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "خط تولید خبر" })).toBeVisible({ timeout: 12_000 });
  await page.getByTestId("header-user-name").click();
  await page.getByRole("menuitem", { name: "مهدی پوریا" }).click();
  await expect(page.getByTestId("header-user-name")).toContainText("مهدی پوریا");
});

test("photographer profile مهدی پوریا", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  data.currentUserId = "u-pouria";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/reporters/my-profile", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("person-profile-name")).toHaveText("مهدی پوریا");
});
