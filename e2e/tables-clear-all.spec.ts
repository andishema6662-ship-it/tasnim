import { expect, test } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { installAdminAuth } from "./admin-login";
import path from "node:path";

test.use({ viewport: { width: 1280, height: 800 } });

test("jihadi table clear all rows", async ({ page }) => {
  const data = createSeed();
  const user = data.users.find((u) => u.username === "shamsaei")!;
  data.currentUserId = user.id;
  data.currentRoleId = user.roleId;
  await installAdminAuth(page, data);
  await page.goto("/admin/structure/tables/", { waitUntil: "domcontentloaded" });
  await page.getByTestId("tables-editor").waitFor({ timeout: 20_000 });
  await page.locator("select").first().selectOption({ label: "گزارش جهادی" });
  await expect(page.getByTestId("tables-editor").locator("tbody tr")).toHaveCount(2);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("tables-clear-all-rows").click();
  await expect(page.getByTestId("tables-editor").locator("tbody tr")).toHaveCount(0);
  await page.screenshot({ path: path.join("/cursor/stores/self/media/jihadi-clear-all", "clear-all.png") });
});
