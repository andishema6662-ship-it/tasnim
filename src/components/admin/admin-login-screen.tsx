"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { resolveSystemVersion, versionDisplay } from "@/lib/changelog";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { resolveBrandMark, SHAMSEH_LOGIN_SUBTITLE, SHAMSEH_MEDIA_NAME } from "@/lib/branding";
import { checkLoginAllowed } from "@/lib/login-guard";
import { publicHomePath } from "@/lib/routes";
import { useNewsroom } from "@/lib/store";
import "./admin-login-codepen.css";

export function AdminLoginScreen() {
  const { data } = useNewsroom();
  const { login, authenticated } = useAdminAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const mark = resolveBrandMark(data.settings.brandMark);
  const systemVersion = versionDisplay(resolveSystemVersion(data));
  const lockout = !checkLoginAllowed().allowed;

  useEffect(() => {
    if (!authenticated) return;
    const target = next.startsWith("/admin") ? next : "/admin";
    if (window.location.pathname + window.location.search === target) return;
    window.location.assign(target);
  }, [authenticated, next]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const gate = checkLoginAllowed();
    if (!gate.allowed) {
      setError(gate.message ?? null);
      return;
    }
    setPending(true);
    const result = await login(username, password);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const target = next.startsWith("/admin") ? next : "/admin";
    window.location.assign(target);
  }

  return (
    <div className="dp-login" data-testid="admin-login-page">
      <div className="dp-login__wrap">
        <section className="dp-login__content" aria-label="شمسه">
          <div className="dp-login__logo">
            <img src={mark} alt={SHAMSEH_MEDIA_NAME} />
          </div>
          <div className="dp-login__content-inner dp-login__content-inner--brand-only">
            <div className="dp-login__hero">
              <h1 className="dp-login__hero-brand">{SHAMSEH_MEDIA_NAME}</h1>
              <p className="dp-login__hero-tagline">{SHAMSEH_LOGIN_SUBTITLE}</p>
            </div>
          </div>
        </section>

        <section className="dp-login__user" aria-label="ورود به پنل">
          <div className="dp-login__form-wrap">
            <p className="dp-login__tab">ورود به پنل</p>
            <form onSubmit={onSubmit}>
              <div className="dp-login__field">
                <label htmlFor="admin-login-username">نام کاربری</label>
                <input
                  id="admin-login-username"
                  data-testid="admin-login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="dp-login__input"
                  placeholder=" "
                  dir="ltr"
                  required
                  disabled={lockout}
                />
              </div>
              <div className="dp-login__field">
                <label htmlFor="admin-login-password">رمز عبور</label>
                <input
                  id="admin-login-password"
                  data-testid="admin-login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="dp-login__input"
                  placeholder=" "
                  dir="ltr"
                  required
                  disabled={lockout}
                />
              </div>
              {error ? (
                <p className="dp-login__error" role="alert" data-testid="admin-login-error">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                data-testid="admin-login-submit"
                className="dp-login__submit"
                disabled={pending || lockout}
              >
                {pending ? "در حال ورود…" : "ورود"}
              </button>
            </form>
            <p className="dp-login__help">
              <Link href={publicHomePath()}>← بازگشت به سایت خبری</Link>
            </p>
            <p className="dp-login__version" data-testid="admin-login-version">
              نسخه {systemVersion}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
