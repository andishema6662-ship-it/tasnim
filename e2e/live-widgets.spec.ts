import { expect, test } from "@playwright/test";
import { installAdminAuth } from "./admin-login";

import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("live widget embed appears on site when configured", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "chief";
  data.templateSettings = {
    ...data.templateSettings,
    liveWidgets: {
      ...data.templateSettings.liveWidgets,
      rates: {
        enabled: true,
        title: "نرخ زنده تست",
        embedCode: '<div data-testid="external-rate-widget">ویجت خارجی</div>',
      },
    },
  };
  await installAdminAuth(page, data);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("portal-widget-rates")).toContainText("نرخ زنده تست");
  await expect(page.getByTestId("external-rate-widget")).toBeVisible();
});

test("theme admin shows live widget script fields", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "chief";
  await installAdminAuth(page, data);
  await page.goto("/admin/template/theme", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("theme-live-widgets")).toBeVisible();
  await expect(page.getByTestId("live-widget-rates-embed")).toBeVisible();
});
