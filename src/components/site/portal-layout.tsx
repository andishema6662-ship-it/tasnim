"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CoverThumb } from "@/components/cover-thumb";
import { faNum, todayTriCalendar } from "@/lib/format";
import { portalSubtitleFromData, portalTitleFromData, resolvePortalBranding, resolvePortalHeaderBanner } from "@/lib/portal-branding";
import { PORTAL_NAV } from "@/lib/site-portal";
import { resolveTickerLines, tickerEnabledResolved, tickerLabelResolved } from "@/lib/homepage-slots";
import { portalThemeStyle, resolveTemplateSettings } from "@/lib/template";
import { useNewsroom } from "@/lib/store";

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const time = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return <span className="font-mono text-xs tabular-nums">{time}</span>;
}

export function PortalLayout({ children }: { children: ReactNode }) {
  const { data } = useNewsroom();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [lang, setLang] = useState<"fa" | "en">("fa");
  const [mobileNav, setMobileNav] = useState(false);
  const dates = useMemo(() => todayTriCalendar(), []);
  const branding = resolvePortalBranding(data);
  const title = portalTitleFromData(data);
  const subtitle = portalSubtitleFromData(data);
  const mark = branding.brandMark;
  const theme = resolveTemplateSettings(data);
  const themeStyle = portalThemeStyle(theme);
  const topAd = resolvePortalHeaderBanner(data);
  const tickerLines = resolveTickerLines(data, theme);
  const tickerOn = tickerEnabledResolved(theme);
  const tickerLabel = tickerLabelResolved(theme);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (pathname === "/site") {
      router.push(q ? `/site?q=${encodeURIComponent(q)}` : "/site");
    } else {
      router.push(q ? `/site?q=${encodeURIComponent(q)}` : "/site");
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-ink" style={themeStyle}>
      {(theme.showTriCalendar || theme.showLiveClock || theme.showLanguageToggle) ? (
        <div className="border-b border-[#d9d9d9] bg-[#1a1a1a] text-white/90">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[11px] sm:text-xs">
            {theme.showTriCalendar ? (
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {dates.map((item) => (
                  <li key={item.label}>
                    <span className="text-white/50">{item.label}:</span> {item.text}
                  </li>
                ))}
              </ul>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              {theme.showLiveClock ? <LiveClock /> : null}
              {theme.showLanguageToggle ? (
                <button
                  type="button"
                  className="rounded border border-white/25 px-2 py-0.5 text-[11px] hover:bg-white/10"
                  onClick={() => setLang((current) => (current === "fa" ? "en" : "fa"))}
                >
                  {lang === "fa" ? "FA" : "EN"}
                </button>
              ) : null}
              <Link href="/" className="text-white/70 hover:text-white">پنل تحریریه</Link>
            </div>
          </div>
        </div>
      ) : null}
      <header className="border-b border-[#ddd] bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/site" className="flex items-center gap-3" data-testid="portal-site-brand">
            {mark ? <img src={mark} alt="" className="h-14 w-14 object-contain" /> : null}
            <div>
              <p className="text-xs text-muted">{subtitle}</p>
              <p className="text-2xl font-black tracking-tight text-[var(--portal-primary)]">{title}</p>
            </div>
          </Link>
          <div className="flex flex-1 flex-col items-stretch gap-3 lg:max-w-xl">
            {topAd ? (
              <a href={topAd.href || "#"} data-testid="portal-header-banner" className="block overflow-hidden rounded border border-line bg-sheet">
                <CoverThumb cover={topAd.image} className="h-[90px] w-full max-w-[728px] mx-auto" />
              </a>
            ) : (
              <div className="mx-auto flex h-[90px] w-full max-w-[728px] items-center justify-center rounded border border-dashed border-line bg-sheet text-xs text-muted">
                بنر هدر غیرفعال است
              </div>
            )}
            <form onSubmit={submitSearch} className="flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جستجو در اخبار…"
                className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm"
                aria-label="جستجو در اخبار"
              />
              <button type="submit" className="rounded-md bg-[var(--portal-primary)] px-4 py-2 text-sm text-white hover:opacity-90">جستجو</button>
            </form>
          </div>
        </div>
      </header>
      <nav className="sticky top-0 z-40 border-b border-black/20 bg-[var(--portal-nav)] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <button type="button" className="py-3 text-sm lg:hidden" onClick={() => setMobileNav((open) => !open)} aria-expanded={mobileNav}>
            منو
          </button>
          <ul className={`${mobileNav ? "flex" : "hidden"} absolute right-0 left-0 top-full flex-col border-t border-black/20 bg-[var(--portal-nav)] lg:static lg:flex lg:flex-row lg:border-0`}>
            <li>
              <Link href="/site" className="block px-4 py-3 text-sm font-semibold hover:bg-[var(--portal-primary)]">صفحه اصلی</Link>
            </li>
            {PORTAL_NAV.map((item) => (
              <li key={item.id} className="group relative">
                <Link
                  href={"href" in item && item.href ? item.href : `/site?cat=${item.categoryId}`}
                  className="block px-4 py-3 text-sm hover:bg-[var(--portal-primary)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      {tickerOn && tickerLines.length ? (
        <div data-testid="portal-ticker" className="overflow-hidden border-b border-line bg-[#2b2b2b] text-white">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm">
            <span className="shrink-0 rounded bg-[var(--portal-accent)] px-2 py-0.5 text-xs font-bold">{tickerLabel}</span>
            <div className="relative min-w-0 flex-1 overflow-hidden whitespace-nowrap">
              <span className="ticker-track inline-block">{tickerLines.join(" ◆ ")} ◆ {tickerLines.join(" ◆ ")}</span>
            </div>
          </div>
        </div>
      ) : null}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <footer className="mt-10 border-t-4 border-[var(--portal-primary)] bg-[#1c1c1c] text-white/85">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-white">{title}</p>
            <p className="mt-2 text-sm leading-7 text-white/70">{theme.aboutFooter || subtitle}</p>
            <p className="mt-3 text-xs text-white/50">{title} · {theme.copyrightText} © {faNum(new Date().getFullYear())}</p>
          </div>
          <div>
            <p className="font-semibold text-white">دسترسی سریع</p>
            <ul className="mt-2 space-y-1 text-sm">
              {PORTAL_NAV.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <Link href={"href" in item && item.href ? item.href : `/site?cat=${item.categoryId}`} className="hover:text-white">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">خبرنامه</p>
            <p className="mt-2 text-sm text-white/70">ایمیل خود را برای دریافت تیترهای مهم وارد کنید.</p>
            <form className="mt-3 flex gap-2" onSubmit={(event) => event.preventDefault()}>
              <input type="email" placeholder="email@example.com" dir="ltr" className="flex-1 rounded border border-white/20 bg-white/10 px-2 py-1.5 text-sm" />
              <button type="submit" className="rounded bg-[var(--portal-primary)] px-3 py-1.5 text-xs">عضویت</button>
            </form>
          </div>
          <div>
            <p className="font-semibold text-white">ارتباط با ما</p>
            <p className="mt-2 text-sm leading-7 text-white/70">تحریریه: desk@newsroom.local</p>
            <p className="text-sm text-white/70">تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {theme.socialTelegram ? <a href={theme.socialTelegram} className="rounded border border-white/20 px-2 py-1 hover:bg-white/10">تلگرام</a> : null}
              {theme.socialInstagram ? <a href={theme.socialInstagram} className="rounded border border-white/20 px-2 py-1 hover:bg-white/10">اینستاگرام</a> : null}
              {theme.socialYoutube ? <a href={theme.socialYoutube} className="rounded border border-white/20 px-2 py-1 hover:bg-white/10">یوتیوب</a> : null}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
