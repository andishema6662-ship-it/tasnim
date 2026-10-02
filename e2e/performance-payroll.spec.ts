import { test, expect } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("reporter profile performance charts", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/reporters/my-profile", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("reporter-performance-panel")).toBeVisible();
  await expect(page.getByTestId("reporter-workload-progress")).toBeVisible();
});

test("payroll approval gate for reporter", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  const reporter = data.users.find((user) => user.roleId === "reporter");
  if (reporter) {
    const now = new Date();
    data.payrollApprovals = data.payrollApprovals.map((item) =>
      item.userId === reporter.id && item.month === now.getMonth() + 1 ? { ...item, status: "pending" } : item,
    );
  }
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/reporters/my-payroll", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("payroll-pending-notice")).toBeVisible();
});
