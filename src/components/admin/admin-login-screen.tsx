"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { DEFAULT_USER_PASSWORD } from "@/lib/password";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { resolveBrandMark, SHAMSEH_MEDIA_NAME, SHAMSEH_TAGLINE } from "@/lib/branding";
import { publicHomePath } from "@/lib/routes";
import { useNewsroom } from "@/lib/store";
import "./admin-login-codepen.css";

const SLIDES = [
  {
    tag: "تحریریه",
    title: "خط تولید خبر",
    text: "کارتابل، سردبیری و انتشار در یک میز واحد شمسه",
  },
  {
    tag: "پورتال",
    title: "خروجی عمومی",
    text: "صفحه اصلی خبرگزاری و پورتال خوانندگان در یک کلیک",
  },
  {
    tag: "تیم",
    title: "نقش‌ها و دسترسی",
    text: "مدیر مسئول، سردبیر و خبرنگار با منوی متناسب",
  },
  {
    tag: "شمسه",
    title: "سامانه جامع",
    text: "میز یکپارچه تولید و انتشار خبر با هویت بصری شمسه",
  },
] as const;

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
  const [slide, setSlide] = useState(0);

  const mark = resolveBrandMark(data.settings.brandMark);
  const panelTitle = (data.settings.mediaName ?? "").trim() || data.settings.newsroomName;

  useEffect(() => {
    if (!authenticated) return;
    router.replace(next.startsWith("/admin") ? next : "/admin");
  }, [authenticated, next, router]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((current) => (current + 1) % SLIDES.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

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
    <div className="dp-login" data-testid="admin-login-page">
      <div className="dp-login__wrap">
        <section className="dp-login__content" aria-label="معرفی شمسه">
          <div className="dp-login__logo">
            <img src={mark} alt={SHAMSEH_MEDIA_NAME} />
          </div>
          <div className="dp-login__slideshow">
            <h1 className="dp-login__hero-brand">{SHAMSEH_MEDIA_NAME}</h1>
            <p className="sr-only">{panelTitle}</p>
            {SLIDES.map((item, index) => (
              <div
                key={item.tag}
                className={`dp-login__slide${index === slide ? " is-active" : ""}`}
                aria-hidden={index !== slide}
              >
                <h2>
                  <span>{item.tag}</span>
                  {item.title}
                </h2>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="dp-login__user" aria-label="ورود به پنل">
          <div className="dp-login__form-wrap">
            <p className="dp-login__tab">ورود به پنل</p>
            <p className="mb-4 text-xs text-[#9aa3b2]">{SHAMSEH_TAGLINE}</p>
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
                  placeholder="Email or Username"
                  dir="ltr"
                  required
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
                  placeholder="Password"
                  dir="ltr"
                  required
                />
              </div>
              {error ? (
                <p className="dp-login__error" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit" data-testid="admin-login-submit" className="dp-login__submit" disabled={pending}>
                {pending ? "در حال ورود…" : "ورود"}
              </button>
            </form>
            <p className="dp-login__help">
              <Link href={publicHomePath()}>← بازگشت به سایت خبری</Link>
            </p>
            <p className="dp-login__demo">
              نسخه نمایشی: کاربران seed (مثلاً <code>rezaei</code>، <code>shamsaei</code>) — رمز پیش‌فرض{" "}
              <code>{DEFAULT_USER_PASSWORD}</code> (هش SHA-256 در localStorage)
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
