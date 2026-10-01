import { test, expect } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("ticket creation with recipient", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/tickets", { waitUntil: "domcontentloaded" });
  await page.getByTestId("ticket-recipient-select").selectOption("it-support");
  await page.getByTestId("ticket-title-input").fill("درخواست تست گیرنده");
  await page.getByTestId("ticket-submit").click();
  await expect(page.getByTestId("ticket-list")).toContainText("پشتیبانی فنی و IT");
  await expect(page.getByTestId("ticket-list")).toContainText("درخواست تست گیرنده");

  await page.getByTestId("ticket-recipient-filter").selectOption("it-support");
  await expect(page.getByTestId("ticket-recipient-cell").first()).toContainText("پشتیبانی فنی");
});
