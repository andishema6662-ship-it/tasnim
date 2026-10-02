import { expect, test } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("reporter todo list and dashboard alerts", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/reporters/my-tasks", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("todo-list")).toBeVisible();
  await page.getByTestId("todo-add-btn").click();
  await expect(page.getByTestId("todo-form-due-popover")).not.toBeVisible();
  await page.getByTestId("todo-form-due-trigger").click();
  const popover = page.getByTestId("todo-form-due-popover");
  await expect(popover).toBeVisible();
  await expect(popover.getByText("ساعت و دقیقه")).toBeVisible();
  await expect(popover.getByLabel("ساعت")).toBeVisible();
  await expect(page.getByText("تکمیل لید گزارش معیشت")).toBeVisible();
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("dashboard-deadline-alerts")).toBeVisible();
  await expect(page.getByTestId("dashboard-pinned-announcements")).toBeVisible();
});

test("notes and file manager quota", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/reporters/my-notes", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("notes-grid")).toBeVisible();
  await page.goto("/admin/reporters/file-manager", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("storage-quota-bar")).toBeVisible();
});

test("my-news blog3 cards", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/reporters/my-news", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("my-news-blog-grid")).toBeVisible();
  await expect(page.getByTestId("blog3-card").first()).toBeVisible();
});

test("chief publishes announcement", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "chief";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/admin/announcements", { waitUntil: "domcontentloaded" });
  await page.getByTestId("announcement-form").getByLabel("عنوان").fill("اطلاعیه تست");
  await page.getByTestId("announcement-form").getByLabel("متن پیام").fill("متن آزمایشی");
  await page.getByTestId("announcement-publish").click();
  await expect(page.getByText("اطلاعیه تست")).toBeVisible();
});
