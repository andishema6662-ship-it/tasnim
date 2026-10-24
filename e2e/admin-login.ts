import type { Page } from "@playwright/test";
import { ADMIN_SESSION_KEY, DEMO_ADMIN_PASSWORD } from "../src/lib/admin-auth";
import { STORAGE_KEY } from "../src/lib/storage";
import type { NewsroomData } from "../src/lib/types";

export function adminSessionForData(data: NewsroomData) {
  const user = data.users.find((u) => u.id === data.currentUserId) ?? data.users[0];
  return {
    userId: user?.id ?? "u-kamran",
    username: user?.username ?? "rezaei",
    loggedInAt: new Date().toISOString(),
  };
}

/** Call before goto on admin routes (static export has no server session). */
export async function installAdminAuth(page: Page, data: NewsroomData) {
  const session = adminSessionForData(data);
  await page.addInitScript(
    ([storageKey, storageJson, authKey, authJson]) => {
      window.localStorage.setItem(storageKey, storageJson);
      window.localStorage.setItem(authKey, authJson);
    },
    [STORAGE_KEY, JSON.stringify(data), ADMIN_SESSION_KEY, JSON.stringify(session)],
  );
}

export async function loginToAdmin(
  page: Page,
  opts: { username?: string; password?: string; next?: string } = {},
) {
  const username = opts.username ?? "rezaei";
  const password = opts.password ?? DEMO_ADMIN_PASSWORD;
  const loginUrl = opts.next ? `/admin/login?next=${encodeURIComponent(opts.next)}` : "/admin/login";
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
  await page.getByTestId("admin-login-username").fill(username);
  await page.getByTestId("admin-login-password").fill(password);
  await page.getByTestId("admin-login-submit").click();
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"), { timeout: 15_000 });
}
