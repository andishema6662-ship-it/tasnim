import { test, expect } from "@playwright/test";
import { installAdminAuth } from "./admin-login";

import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";
import { defaultTemplateSettings } from "../src/lib/template";

test("enterprise modules and portal widgets", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  data.templateSettings = {
    ...defaultTemplateSettings(),
    ershadLicense: { enabled: true, code: "۱۲۳۴۵۶۷۸", badgeImage: "" },
  };
  await installAdminAuth(page, data);

  await page.goto("/admin/reports/pitch-performance", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("pitch-performance-table")).toBeVisible();

  await page.goto("/admin/reports/payroll", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("payroll-slip")).toBeVisible();

  await page.goto("/admin/editorial/ai-hub", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("ai-text-correction-hero")).toBeVisible();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("portal-widgets")).toBeVisible();
  await expect(page.getByTestId("portal-ershad-license")).toContainText("۱۲۳۴۵۶۷۸");
  await expect(page.getByTestId("portal-featured-dossiers")).toBeVisible();
});

test("cartable social publish modal", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  await installAdminAuth(page, data);
  await page.goto("/admin/editorial/cartable", { waitUntil: "domcontentloaded" });
  await page.getByTestId("cartable-social-publish").first().click();
  await expect(page.getByTestId("social-publish-modal")).toBeVisible();
  await expect(page.getByTestId("social-publish-preview")).not.toHaveText("");
});
