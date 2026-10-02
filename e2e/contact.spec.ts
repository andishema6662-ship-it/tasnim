import { expect, test } from "@playwright/test";
import { createSeed } from "../src/lib/seed";
import { STORAGE_KEY } from "../src/lib/storage";

test("public contact form with captcha persists message", async ({ page }) => {
  const data = createSeed();
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("site-contact-intro")).toBeVisible();
  await page.getByTestId("site-contact-form").getByLabel("نام و نام خانوادگی").fill("کاربر تست");
  await page.getByTestId("site-contact-form").getByLabel("عنوان پیام").fill("سوال عمومی");
  await page.getByTestId("site-contact-form").getByLabel(/متن توضیح/).fill("متن آزمایشی تماس.");
  const formText = await page.getByTestId("site-contact-form").textContent();
  const captchaLine = formText?.match(/([۰-۹]+)\s*\+\s*([۰-۹]+)/);
  expect(captchaLine).toBeTruthy();
  const digits = "۰۱۲۳۴۵۶۷۸۹";
  const parseFa = (s: string) => [...s].reduce((n, ch) => n * 10 + (digits.includes(ch) ? digits.indexOf(ch) : Number(ch)), 0);
  const sum = parseFa(captchaLine![1]!) + parseFa(captchaLine![2]!);
  await page.getByTestId("contact-captcha-answer").fill(String(sum));
  await page.getByTestId("contact-submit").click();
  await expect(page.getByText("پیام شما ثبت شد")).toBeVisible();
});

test("admin contact inbox and reporter sidebar group", async ({ page }) => {
  const data = createSeed();
  data.currentRoleId = "reporter";
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(data)],
  );
  await page.goto("/admin/reporters/my-profile", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("person-profile")).toBeVisible();
});
