"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { norm, todayTriCalendar } from "@/lib/format";
import { groups, hrefFor, modules } from "@/lib/modules";
import { useNewsroom } from "@/lib/store";
import { currentRole } from "@/lib/workflow";
import { cn } from "./ui";

function NavList({ query, onNavigate }: { query: string; onNavigate?: () => void }) {
  const path = usePathname();
  const q = norm(query);
  const visible = modules.filter((item) => {
    if (!q) return true;
    const group = groups.find((entry) => entry.id === item.group);
    return norm(item.title).includes(q) || norm(group?.title ?? "").includes(q);
  });

  return (
    <div className="space-y-5">
      <Link
        href="/"
        onClick={onNavigate}
        className={cn("block rounded-md px-3 py-2 text-sm", path === "/" ? "bg-sand font-semibold" : "hover:bg-sand/70")}
      >
        پیشخوان
      </Link>
      {groups.map((group) => {
        const items = visible.filter((item) => item.group === group.id);
        if (!items.length) return null;
        return (
          <section key={group.id}>
            <h2 className="px-3 text-xs font-semibold text-rule">{group.title}</h2>
            <ul className="mt-1">
              {items.map((item) => {
                const href = hrefFor(item.group, item.slug);
                const active = path === href || path.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={cn("block rounded-md px-3 py-1.5 text-sm leading-6", active ? "bg-sand font-semibold" : "hover:bg-sand/70")}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { data, setRole } = useNewsroom();
  const path = usePathname();
  const [query, setQuery] = useState("");
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === path;
  const role = currentRole(data);
  const dates = useMemo(() => todayTriCalendar(), []);
  const panelTitle = data.settings.mediaName.trim() || data.settings.newsroomName;
  const panelSubtitle = data.settings.mediaDisplayTitle.trim() || data.settings.tagline;
  const panelMark = data.settings.brandMark;

  function setOpen(next: boolean) {
    setMenuPath(next ? path : null);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuPath(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen bg-paper text-ink lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-l border-line bg-sheet lg:flex">
        <div className="border-b border-line px-4 py-4">
          <div className="flex items-start gap-3">
            {panelMark ? <img src={panelMark} alt="" className="mt-0.5 h-10 w-10 shrink-0 rounded object-contain" /> : null}
            <div className="min-w-0">
              <p className="text-[11px] text-muted">{panelSubtitle}</p>
              <p className="text-xl font-bold leading-8">{panelTitle}</p>
            </div>
          </div>
        </div>
        <div className="px-3 py-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجوی بخش"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
            aria-label="جستجوی بخش"
          />
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-8">
          <NavList query={query} />
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-line bg-mast text-paper">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-md border border-white/20 px-3 py-1.5 text-sm lg:hidden" onClick={() => setOpen(true)}>
                بخش‌ها
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold lg:hidden">{panelTitle}</p>
                <ul className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-5 text-white/85 sm:text-xs" aria-label="تاریخ امروز">
                  {dates.map((item) => (
                    <li key={item.label} className="whitespace-normal">
                      <span className="font-semibold text-white/55">{item.label}:</span> {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 rounded-full bg-white/10 p-1" role="group" aria-label="نقش فعلی">
              {data.roles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.id)}
                  className={cn("rounded-full px-3 py-1 text-xs", item.id === role.id ? "bg-sheet font-semibold text-ink" : "text-white/80")}
                  aria-pressed={item.id === role.id}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div className="h-1 bg-rule" />
        </header>
        <main className="px-4 py-6 pb-16 lg:px-8">{children}</main>
        <p className="px-4 pb-6 text-xs text-muted lg:px-8">داده‌ها در حافظه همین مرورگر می‌ماند و با تازه‌سازی از بین نمی‌رود.</p>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="بستن منو" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-sheet shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-bold">{panelTitle}</p>
              <button type="button" className="text-sm text-muted" onClick={() => setOpen(false)}>
                بستن
              </button>
            </div>
            <div className="px-3 py-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جستجوی بخش"
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
                aria-label="جستجوی بخش"
              />
            </div>
            <nav className="flex-1 overflow-y-auto px-2 pb-8">
              <NavList query={query} onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
