import { expect, test } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("sidebar places template group before infra", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "publisher";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "خط تولید خبر" })).toBeVisible({ timeout: 12_000 });
  const titles = await page.locator("nav button[aria-controls^='nav-section-'] span.leading-6").allTextContents();
  const templateIndex = titles.findIndex((t) => t.includes("تنظیمات قالب"));
  const infraIndex = titles.findIndex((t) => t.includes("زیرساخت"));
  expect(templateIndex).toBeGreaterThan(-1);
  expect(infraIndex).toBeGreaterThan(-1);
  expect(templateIndex).toBeLessThan(infraIndex);
  expect(infraIndex).toBe(titles.length - 1);
});
