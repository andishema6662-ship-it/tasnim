import { test, expect } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("social bot configuration persists locally", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/template/social", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("social-bots-config")).toBeVisible();
  await page.getByTestId("bot-telegram-token").fill("test-token-123");
  await page.getByTestId("bot-test-connection").click();
  await expect(page.getByTestId("bot-test-result")).toContainText("موفق");
});
