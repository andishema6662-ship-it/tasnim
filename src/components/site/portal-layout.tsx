"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CoverThumb } from "@/components/cover-thumb";
import { faNum, todayTriCalendar } from "@/lib/format";
import { publishedStories } from "@/lib/site";
import { PORTAL_NAV, portalBannerAds, portalSiteSubtitle, portalSiteTitle } from "@/lib/site-portal";
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
  const title = portalSiteTitle(data);
  const subtitle = portalSiteSubtitle(data);
  const mark = data.settings.brandMark ?? "";
  const ads = portalBannerAds(data);
  const topAd = ads[0];
  const tickerLines = [
    ...data.tickers.filter((item) => item.active).map((item) => item.text),
    ...publishedStories(data).slice(0, 6).map((story) => story.title),
  ];

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
    <div className="min-h-screen bg-[#f4f4f4] text-ink">
      <div className="border-b border-[#d9d9d9] bg-[#1a1a1a] text-white/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[11px] sm:text-xs">
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {dates.map((item) => (
              <li key={item.label}>
                <span className="text-white/50">{item.label}:</span> {item.text}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <LiveClock />
            <button
              type="button"
              className="rounded border border-white/25 px-2 py-0.5 text-[11px] hover:bg-white/10"
              onClick={() => setLang((current) => (current === "fa" ? "en" : "fa"))}
            >
              {lang === "fa" ? "FA" : "EN"}
            </button>
            <Link href="/" className="text-white/70 hover:text-white">پنل تحریریه</Link>
          </div>
        </div>
      </div>
      <header className="border-b border-[#ddd] bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/site" className="flex items-center gap-3">
            {mark ? <img src={mark} alt="" className="h-14 w-14 object-contain" /> : null}
            <div>
              <p className="text-xs text-muted">{subtitle}</p>
              <p className="text-2xl font-black tracking-tight text-[#8e1e2d]">{title}</p>
            </div>
          </Link>
          <div className="flex flex-1 flex-col items-stretch gap-3 lg:max-w-xl">
            {topAd?.image ? (
              <a href={topAd.href || "#"} className="block overflow-hidden rounded border border-line bg-sheet">
                <CoverThumb cover={topAd.image} className="h-[90px] w-full max-w-[728px] mx-auto" />
              </a>
            ) : (
              <div className="mx-auto flex h-[90px] w-full max-w-[728px] items-center justify-center rounded border border-dashed border-line bg-sheet text-xs text-muted">
                جایگاه تبلیغ ۷۲۸×۹۰
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
              <button type="submit" className="rounded-md bg-[#8e1e2d] px-4 py-2 text-sm text-white hover:bg-[#6f1824]">جستجو</button>
            </form>
          </div>
        </div>
      </header>
      <nav className="sticky top-0 z-40 border-b border-[#5c1520] bg-[#7a1f2e] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <button type="button" className="py-3 text-sm lg:hidden" onClick={() => setMobileNav((open) => !open)} aria-expanded={mobileNav}>
            منو
          </button>
          <ul className={`${mobileNav ? "flex" : "hidden"} absolute right-0 left-0 top-full flex-col border-t border-[#5c1520] bg-[#7a1f2e] lg:static lg:flex lg:flex-row lg:border-0`}>
            <li>
              <Link href="/site" className="block px-4 py-3 text-sm font-semibold hover:bg-[#8e1e2d]">صفحه اصلی</Link>
            </li>
            {PORTAL_NAV.map((item) => (
              <li key={item.id} className="group relative">
                <Link
                  href={"href" in item && item.href ? item.href : `/site?cat=${item.categoryId}`}
                  className="block px-4 py-3 text-sm hover:bg-[#8e1e2d]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      {tickerLines.length ? (
        <div className="overflow-hidden border-b border-line bg-[#2b2b2b] text-white">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm">
            <span className="shrink-0 rounded bg-[#c41e3a] px-2 py-0.5 text-xs font-bold">فوری</span>
            <div className="relative min-w-0 flex-1 overflow-hidden whitespace-nowrap">
              <span className="ticker-track inline-block">{tickerLines.join(" ◆ ")} ◆ {tickerLines.join(" ◆ ")}</span>
            </div>
          </div>
        </div>
      ) : null}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <footer className="mt-10 border-t-4 border-[#8e1e2d] bg-[#1c1c1c] text-white/85">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-white">{title}</p>
            <p className="mt-2 text-sm leading-7 text-white/70">{subtitle}</p>
            <p className="mt-3 text-xs text-white/50">خبرگزاری نمونه · تمام حقوق محفوظ است © {faNum(new Date().getFullYear())}</p>
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
              <button type="submit" className="rounded bg-[#8e1e2d] px-3 py-1.5 text-xs">عضویت</button>
            </form>
          </div>
          <div>
            <p className="font-semibold text-white">ارتباط با ما</p>
            <p className="mt-2 text-sm leading-7 text-white/70">تحریریه: desk@newsroom.local</p>
            <p className="text-sm text-white/70">تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</p>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="rounded border border-white/20 px-2 py-1">تلگرام</span>
              <span className="rounded border border-white/20 px-2 py-1">اینستاگرام</span>
              <span className="rounded border border-white/20 px-2 py-1">یوتیوب</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
