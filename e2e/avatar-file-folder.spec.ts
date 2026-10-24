import { test, expect } from "@playwright/test";
import { installAdminAuth } from "./admin-login";

import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("reporter profile avatar upload controls", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  await installAdminAuth(page, data);
  await page.goto("/admin/reporters/my-profile", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("person-avatar-editor")).toBeVisible();
  await expect(page.getByTestId("person-avatar-upload-btn")).toBeVisible();
  const tinyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.getByTestId("person-avatar-file").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: tinyPng,
  });
  await expect(page.getByTestId("person-avatar-success-toast")).toHaveText("تصویر پروفایل با موفقیت به‌روزرسانی شد");
  await expect(page.getByTestId("person-avatar-clear-btn")).toBeVisible();
});

test("file lands in selected folder", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  const user = data.users.find((u) => u.roleId === "reporter");
  const folderId = "fld-e2e";
  if (user) {
    data.reporterFiles.push({
      id: folderId,
      ownerUserId: user.id,
      parentId: null,
      name: "پوشه تست",
      kind: "folder",
      sizeBytes: 0,
      mime: "",
      sharedWith: [],
      createdAt: new Date().toISOString(),
    });
  }
  await installAdminAuth(page, data);
  await page.goto("/admin/reporters/file-manager", { waitUntil: "domcontentloaded" });
  await page.getByTestId("file-upload-folder-select").selectOption(folderId);
  const tinyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.getByTestId("file-upload-input").setInputFiles({
    name: "tiny.png",
    mimeType: "image/png",
    buffer: tinyPng,
  });
  await page.getByRole("button", { name: "پوشه تست" }).click();
  await expect(page.getByTestId("file-grid")).toContainText("tiny.png");
});
