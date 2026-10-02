"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { DEMO_ADMIN_PASSWORD } from "@/lib/admin-auth";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { resolveBrandMark, SHAMSEH_ADMIN_HEADER, SHAMSEH_MEDIA_NAME, SHAMSEH_TAGLINE } from "@/lib/branding";
import { publicHomePath } from "@/lib/routes";
import { useNewsroom } from "@/lib/store";
import { cn } from "@/components/ui";

export function AdminLoginScreen() {
  const { data } = useNewsroom();
  const { login, authenticated } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const mark = resolveBrandMark(data.settings.brandMark);
  const panelTitle = (data.settings.mediaName ?? "").trim() || data.settings.newsroomName;

  useEffect(() => {
    if (!authenticated) return;
    router.replace(next.startsWith("/admin") ? next : "/admin");
  }, [authenticated, next, router]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = login(username, password);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace(next.startsWith("/admin") ? next : "/admin");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f0eeea] to-paper">
      <header className="border-b border-line/80 bg-sheet/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <Link href={publicHomePath()} className="text-sm text-muted hover:text-primary">
            ← بازگشت به سایت خبری
          </Link>
          <span className="text-xs text-muted">{SHAMSEH_ADMIN_HEADER}</span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-md rounded-2xl border border-line bg-sheet p-8 shadow-lg"
          data-testid="admin-login-page"
        >
          <div className="flex flex-col items-center text-center">
            <img src={mark} alt={SHAMSEH_MEDIA_NAME} className="h-16 w-16 object-contain" />
            <h1 className="mt-4 text-xl font-black text-primary">{panelTitle}</h1>
            <p className="mt-1 text-sm text-muted">{SHAMSEH_TAGLINE}</p>
            <p className="mt-4 text-sm font-semibold text-ink">ورود به پنل مدیریت</p>
          </div>
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">نام کاربری</span>
              <input
                data-testid="admin-login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="مثلاً rezaei"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">رمز عبور</span>
              <input
                data-testid="admin-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>
            {error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              data-testid="admin-login-submit"
              disabled={pending}
              className={cn(
                "w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-sm transition-opacity",
                pending && "opacity-70",
              )}
            >
              {pending ? "در حال ورود…" : "ورود"}
            </button>
          </form>
          <p className="mt-6 text-center text-[11px] leading-5 text-muted">
            نسخه نمایشی: کاربران seed (مثلاً <span className="font-mono">rezaei</span>،{" "}
            <span className="font-mono">shamsaei</span>) — رمز یکسان{" "}
            <span className="font-mono">{DEMO_ADMIN_PASSWORD}</span>
          </p>
        </div>
      </main>
    </div>
  );
}
