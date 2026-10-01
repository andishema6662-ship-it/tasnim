import { test, expect } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("editorial chat messenger", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/tickets", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("chat-layout")).toBeVisible();
  await expect(page.getByTestId("chat-sidebar")).toBeVisible();
  await page.getByTestId("chat-thread-item").first().click();
  await page.getByTestId("chat-input").fill("پیام آزمایشی از تست");
  await page.getByTestId("chat-send").click();
  await expect(page.getByTestId("chat-messages")).toContainText("پیام آزمایشی از تست");
});
