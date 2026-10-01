import { expect, test } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("admin people HexaDash cards and add member", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/media/people", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "همکاران رسانه‌ای و دست‌اندرکاران" })).toBeVisible();
  await expect(page.getByTestId("people-card-grid")).toBeVisible();
  await expect(page.getByText("محمدحسین شمسایی")).toBeVisible();
  await page.getByTestId("people-add-btn").click();
  await page.getByTestId("people-form").getByLabel("نام کامل").fill("تست عضو");
  await page.getByTestId("people-form").getByRole("button", { name: "ذخیره" }).click();
  await expect(page.getByText("تست عضو")).toBeVisible();
});

test("public site people page", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/site/people", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("site-people-grid")).toBeVisible();
  await expect(page.getByText("سارا محمدی")).toBeVisible();
  await page.getByTestId("person-profile-link").first().click();
  await expect(page.getByTestId("person-profile")).toBeVisible();
});
