import { expect, test } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("dashboard footer shows version and changelog link", async ({ page }) => {
  const data = createSeed();
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "خط تولید خبر" })).toBeVisible({ timeout: 12_000 });
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("نسخه");
  await expect(footer).toContainText("۲.۴.۰");
  await footer.getByTestId("system-changelog-link").click();
  await expect(page).toHaveURL(/\/infra\/changelog/);
  await expect(page.getByTestId("changelog-latest-card")).toBeVisible();
  await expect(page.getByTestId("changelog-latest-card")).toContainText("۲.۴.۰");
});

test("chief can publish new changelog version and footer updates", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "chief";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/infra/changelog", { waitUntil: "domcontentloaded" });
  await page.getByTestId("changelog-add-version").click();
  await page.getByTestId("changelog-form-version").fill("2.5.0");
  await page.getByTestId("changelog-form-jalali-label").fill("مهر ۱۴۰۵");
  await page.getByTestId("changelog-input-new-0").fill("تست انتشار نسخه از پنل تغییرات");
  await page.getByTestId("changelog-submit-version").click();
  await expect(page.getByTestId("changelog-latest-card")).toContainText("۲.۵.۰");
  await expect(page.getByRole("contentinfo")).toContainText("۲.۵.۰");
});

test("changelog accordion expands older release", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/infra/changelog", { waitUntil: "domcontentloaded" });
  await page.getByTestId("changelog-release-2.0.0").getByRole("button").click();
  await expect(page.getByTestId("changelog-release-2.0.0")).toContainText("پیشخوان تحریریه");
});
