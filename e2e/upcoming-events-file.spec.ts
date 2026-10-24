import { test, expect } from "@playwright/test";
import { installAdminAuth } from "./admin-login";

import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("dashboard upcoming events widget", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  await installAdminAuth(page, data);
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("dashboard-upcoming-events")).toBeVisible();
  await expect(page.getByTestId("upcoming-event-item").first()).toBeVisible();
  await page.getByTestId("upcoming-range-month").click();
});

test("file upload folder selector", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  const user = data.users.find((u) => u.roleId === "reporter");
  if (user) {
    data.reporterFiles.push({
      id: "fld-test",
      ownerUserId: user.id,
      parentId: null,
      name: "گزارش‌ها",
      kind: "folder",
      sizeBytes: 0,
      mime: "",
      sharedWith: [],
      createdAt: new Date().toISOString(),
    });
  }
  await installAdminAuth(page, data);
  await page.goto("/admin/reporters/file-manager", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("file-upload-folder-select")).toBeVisible();
});
