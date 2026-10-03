import { test, expect } from "@playwright/test";
import { installAdminAuth } from "./admin-login";

import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("enhancements smoke", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  await installAdminAuth(page, data);

  await page.goto("/admin/admin/official-contacts", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("official-contacts-search")).toBeVisible();

  await page.goto("/admin/editorial/agenda", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("agenda-jalali-header")).toBeVisible();

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByTestId("portal-home-poll")).toBeVisible();

  await page.goto("/admin/reports/pitch-performance", { waitUntil: "domcontentloaded" });
  await page.getByTestId("pitch-produced-link").first().click();
  await expect(page.getByTestId("pitch-stories-modal")).toBeVisible();
});
