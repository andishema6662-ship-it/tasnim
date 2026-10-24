import { test, expect } from "@playwright/test";
import { installAdminAuth } from "./admin-login";

import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("official contacts directory CRUD search", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  await installAdminAuth(page, data);
  await page.goto("/admin/admin/official-contacts", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("official-contacts-table")).toBeVisible();
  await page.getByTestId("official-contacts-search").fill("احمدی");
  await expect(page.getByText("دکتر مریم احمدی")).toBeVisible();
});

test("dashboard agenda reminder and agenda page", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  await installAdminAuth(page, data);
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("dashboard-agenda-reminders")).toBeVisible();
  await expect(page.getByTestId("dashboard-agenda-line").first()).toContainText(/مصاحبه|گزارش میدانی/);

  await page.goto("/admin/editorial/agenda", { waitUntil: "networkidle" });
  await expect(page.getByTestId("agenda-list")).toContainText("مدیرکل آموزش و پرورش");
});
