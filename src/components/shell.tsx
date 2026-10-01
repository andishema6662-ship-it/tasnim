"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { resolveBrandMark, SHAMSEH_ADMIN_HEADER, SHAMSEH_MEDIA_NAME } from "@/lib/branding";
import { norm, todayTriCalendar } from "@/lib/format";
import { canAccessPath, DASHBOARD_MODULE_KEY, effectiveModuleKeys } from "@/lib/module-access";
import { type GroupId, groups, hrefFor, moduleKey, modules } from "@/lib/modules";
import { activeNavGroup, loadNavSections, saveNavSections } from "@/lib/nav-sections";
import { useNewsroom } from "@/lib/store";
import { currentRole, currentUser } from "@/lib/workflow";
import { NotificationPreviewList } from "./dashboard/dashboard-alerts";
import { LiveClock } from "./live-clock";
import { dashboardAlertCount } from "@/lib/reporter-workspace";
import { UnauthorizedPanel } from "./unauthorized-panel";
import { cn } from "./ui";

const SIDEBAR_KEY = "tasnim-admin-sidebar-v1";

function loadSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

function saveSidebarCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0" />
    </svg>
  );
}

function IconTicket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16v3a2 2 0 0 1 0 4V19H4v-4a2 2 0 0 0 0-4V8z" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  );
}

const groupAccent: Record<GroupId, string> = {
  editorial: "text-accent-blue bg-indigo-50",
  reporters: "text-orange-600 bg-orange-50",
  media: "text-emerald-600 bg-emerald-50",
  audience: "text-amber-600 bg-amber-50",
  reports: "text-sky-600 bg-sky-50",
  structure: "text-rose-600 bg-rose-50",
  template: "text-primary bg-primary-light",
  admin: "text-violet-700 bg-violet-50",
  infra: "text-slate-600 bg-slate-100",
};

function NavList({
  query,
  onNavigate,
  collapsed,
}: {
  query: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { data } = useNewsroom();
  const path = usePathname();
  const allowedKeys = useMemo(() => new Set(effectiveModuleKeys(data)), [data]);
  const q = norm(query);
  const searching = q.length > 0;
  const activeGroup = activeNavGroup(path);
  const [toggled, setToggled] = useState<Partial<Record<GroupId, boolean>>>(() => {
    const stored = loadNavSections();
    const next: Partial<Record<GroupId, boolean>> = {};
    groups.forEach((group) => {
      next[group.id] = stored[group.id] ?? false;
    });
    return next;
  });

  const openSections = useMemo(() => {
    const next = { ...toggled };
    if (activeGroup) next[activeGroup] = true;
    return next;
  }, [toggled, activeGroup]);

  useEffect(() => {
    if (!activeGroup) return;
    const stored = loadNavSections();
    if (stored[activeGroup]) return;
    saveNavSections({ ...stored, [activeGroup]: true });
  }, [activeGroup]);

  const visible = modules.filter((item) => {
    if (!allowedKeys.has(moduleKey(item))) return false;
    if (!q) return true;
    const group = groups.find((entry) => entry.id === item.group);
    return norm(item.title).includes(q) || norm(group?.title ?? "").includes(q);
  });

  function toggleSection(groupId: GroupId) {
    setToggled((current) => {
      const next = { ...current, [groupId]: !openSections[groupId] };
      const toStore = { ...next };
      if (activeGroup) toStore[activeGroup] = true;
      saveNavSections(toStore);
      return next;
    });
  }

  function sectionOpen(groupId: GroupId) {
    if (searching || collapsed) return true;
    return Boolean(openSections[groupId]);
  }

  const linkActive = "bg-primary-light font-semibold text-primary";
  const linkIdle = "text-ink/90 hover:bg-sand";

  return (
    <div className="space-y-2">
      {allowedKeys.has(DASHBOARD_MODULE_KEY) ? (
        <Link
          href="/"
          onClick={onNavigate}
          title="پیشخوان"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
            path === "/" ? linkActive : linkIdle,
            collapsed && "justify-center px-2",
          )}
        >
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary", path === "/" && "bg-primary text-white")}>
            <IconHome className="h-4 w-4" />
          </span>
          {!collapsed ? <span>پیشخوان</span> : null}
        </Link>
      ) : null}
      {groups.map((group) => {
        const items = visible.filter((item) => item.group === group.id);
        if (!items.length) return null;
        const expanded = sectionOpen(group.id);
        const accent = groupAccent[group.id];
        return (
          <section key={group.id}>
            {!collapsed ? (
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-right text-xs font-semibold text-muted transition-colors hover:bg-sand"
                onClick={() => toggleSection(group.id)}
                aria-expanded={expanded}
                aria-controls={`nav-section-${group.id}`}
              >
                <span className="flex items-center gap-2">
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold", accent)}>
                    {group.title.slice(0, 1)}
                  </span>
                  <span className="leading-6 text-ink/80">{group.title}</span>
                </span>
                <IconChevron open={expanded} />
              </button>
            ) : null}
            {expanded ? (
              <ul id={`nav-section-${group.id}`} className={cn("space-y-0.5", !collapsed && "mt-0.5 mr-1 border-r-2 border-line pr-2")}>
                {items.map((item) => {
                  const href = hrefFor(item.group, item.slug);
                  const active = path === href || path.startsWith(`${href}/`);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        title={item.title}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm leading-6 transition-colors",
                          active ? linkActive : linkIdle,
                          collapsed && "justify-center px-2",
                        )}
                      >
                        {collapsed ? (
                          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold", accent)}>{item.title.slice(0, 1)}</span>
                        ) : (
                          <>
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? "bg-primary" : "bg-line")} />
                            {item.title}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function HeaderIconButton({
  href,
  label,
  badge,
  children,
  onClick,
}: {
  href?: string;
  label: string;
  badge?: number;
  children: ReactNode;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </>
  );
  const className =
    "relative flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink";
  if (href) {
    return (
      <Link href={href} className={className} aria-label={label} title={label}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={className} aria-label={label} title={label} onClick={onClick}>
      {inner}
    </button>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { data, setRole } = useNewsroom();
  const path = usePathname();
  const [query, setQuery] = useState("");
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadSidebarCollapsed());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [lang, setLang] = useState<"fa" | "en">("fa");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const open = menuPath === path;
  const role = currentRole(data);
  const user = currentUser(data);
  const dates = useMemo(() => todayTriCalendar(), []);
  const panelTitle = (data.settings.mediaName ?? "").trim() || data.settings.newsroomName;
  const panelSubtitle = (data.settings.mediaDisplayTitle ?? "").trim() || data.settings.tagline;
  const panelMark = resolveBrandMark(data.settings.brandMark);
  const headerBrandTitle = SHAMSEH_ADMIN_HEADER;

  useEffect(() => {
    if (!userOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [userOpen]);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      saveSidebarCollapsed(next);
      return next;
    });
  }

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

  const notifyCount =
    data.submissions.filter((item) => item.status === "new").length +
    data.suggestions.filter((item) => item.status === "pending").length +
    data.comments.filter((item) => item.status === "pending").length +
    dashboardAlertCount(data);
  const chatUnread = data.chatMessages.filter((message) => {
    const cursor = data.chatReadCursors.find((item) => item.userId === user?.id && item.threadId === message.threadId);
    return message.senderUserId !== user?.id && message.createdAt > (cursor?.lastReadAt ?? "");
  }).length;

  const isPublicSite = path === "/site" || path.startsWith("/site/");
  if (isPublicSite) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-paper text-ink lg:flex">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-l border-line bg-sheet shadow-sm transition-[width] duration-200 lg:flex",
          sidebarCollapsed ? "w-[4.75rem]" : "w-72",
        )}
      >
        <div className={cn("flex items-center gap-3 border-b border-line px-3 py-4", sidebarCollapsed && "justify-center px-2")}>
          <img
            src={panelMark}
            alt={SHAMSEH_MEDIA_NAME}
            className={cn("shrink-0 object-contain drop-shadow-sm", sidebarCollapsed ? "h-11 w-11" : "h-14 w-14")}
          />
          {!sidebarCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-7 text-primary">{panelTitle}</p>
              <p className="truncate text-[11px] leading-5 text-muted">{panelSubtitle}</p>
            </div>
          ) : null}
        </div>
        {!sidebarCollapsed ? (
          <div className="px-3 py-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجوی بخش"
              className="w-full rounded-full border border-line bg-paper px-4 py-2 text-sm placeholder:text-muted focus:border-primary/40"
              aria-label="جستجوی بخش"
            />
          </div>
        ) : null}
        <nav className="admin-nav-scroll flex-1 overflow-y-auto px-2 pb-4">
          <NavList query={query} collapsed={sidebarCollapsed} />
        </nav>
        {!sidebarCollapsed ? (
          <div className="m-3 rounded-xl border border-line bg-gradient-to-l from-primary-light/80 to-sheet p-3 text-xs leading-6">
            <p className="font-bold text-ink">پشتیبانی تحریریه</p>
            <p className="mt-1 text-muted">تیکت فنی یا درخواست دسترسی را از بخش تیکتینگ ثبت کنید.</p>
            <Link href="/admin/chat" className="mt-2 inline-block font-semibold text-primary hover:underline">
              تیکت جدید
            </Link>
          </div>
        ) : null}
        <div className={cn("border-t border-line px-3 py-3", sidebarCollapsed && "px-2")}>
          <div className={cn("flex items-center gap-2 rounded-xl bg-paper px-2 py-2", sidebarCollapsed && "justify-center")}>
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {user?.name?.slice(0, 1) ?? "؟"}
              <span className="absolute bottom-0 left-0 h-2.5 w-2.5 rounded-full border-2 border-sheet bg-emerald-500" title="فعال" />
            </span>
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="truncate text-[11px] text-muted">{role.name}</p>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-line bg-sheet shadow-sm">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4 lg:gap-3">
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-sand lg:flex"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? "باز کردن منو" : "جمع کردن منو"}
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-lg px-2 py-2 text-sm lg:hidden hover:bg-sand" onClick={() => setOpen(true)} aria-label="بخش‌ها">
              <IconMenu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex min-w-0 items-center gap-2 lg:gap-2.5" data-testid="admin-header-brand">
              <img src={panelMark} alt={SHAMSEH_MEDIA_NAME} className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10" />
              <div className="min-w-0 max-w-[11rem] sm:max-w-xs lg:max-w-sm">
                <p className="truncate text-xs font-bold leading-5 text-ink sm:text-sm">{headerBrandTitle}</p>
                <p className="hidden truncate text-[10px] text-muted sm:block">{panelTitle}</p>
              </div>
            </Link>
            <form
              className="order-3 w-full min-w-0 flex-1 sm:order-none sm:max-w-md"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <label className="relative block">
                <span className="sr-only">جستجو در منو</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="جستجو در بخش‌ها…"
                  className="w-full rounded-full border border-line bg-paper py-2.5 pr-4 pl-10 text-sm placeholder:text-muted focus:border-primary/40"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3-3" />
                  </svg>
                </span>
              </label>
            </form>
            <div className="ms-auto flex flex-wrap items-center gap-0.5 sm:gap-1">
              <HeaderIconButton href="/admin/chat" label="چت تحریریه" badge={chatUnread}>
                <IconTicket className="h-5 w-5" />
              </HeaderIconButton>
              <div className="relative">
                <HeaderIconButton label="اعلان‌ها" badge={notifyCount} onClick={() => setNotifyOpen((v) => !v)}>
                  <IconBell className="h-5 w-5" />
                </HeaderIconButton>
                {notifyOpen ? (
                  <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border border-line bg-sheet shadow-lg">
                    <p className="border-b border-line px-3 py-2 text-xs font-bold text-muted">اعلان‌های هوشمند</p>
                    <NotificationPreviewList />
                  </div>
                ) : null}
              </div>
              <div className="relative">
                <HeaderIconButton label="تقویم" onClick={() => setCalendarOpen((v) => !v)}>
                  <IconCalendar className="h-5 w-5" />
                </HeaderIconButton>
                {calendarOpen ? (
                  <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-line bg-sheet p-3 shadow-lg">
                    <p className="mb-2 text-xs font-bold text-muted">تاریخ امروز</p>
                    <ul className="space-y-1.5 text-xs leading-5">
                      {dates.map((item) => (
                        <li key={item.label}>
                          <span className="font-semibold text-primary">{item.label}:</span> {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="hidden h-10 items-center gap-1 rounded-full border border-line px-3 text-xs font-medium text-muted hover:bg-sand sm:flex"
                onClick={() => setLang((l) => (l === "fa" ? "en" : "fa"))}
                aria-label="تغییر زبان"
              >
                <IconGlobe className="h-4 w-4" />
                {lang === "fa" ? "فا" : "EN"}
              </button>
              <div className="hidden items-center gap-1 rounded-full border border-line bg-paper p-0.5 md:flex" role="group" aria-label="نقش فعلی">
                {data.roles.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] transition-colors sm:px-3 sm:text-xs",
                      item.id === role.id ? "bg-primary font-semibold text-white shadow-sm" : "text-muted hover:text-ink",
                    )}
                    aria-pressed={item.id === role.id}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  className="flex h-10 items-center gap-2 rounded-full border border-line pl-1 pr-2 hover:bg-sand"
                  onClick={() => setUserOpen((v) => !v)}
                  aria-expanded={userOpen}
                  aria-haspopup="menu"
                >
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {user?.name?.slice(0, 1) ?? "؟"}
                    <span className="absolute bottom-0 left-0 h-2 w-2 rounded-full border border-sheet bg-emerald-500" />
                  </span>
                  <span className="hidden max-w-[6rem] truncate text-xs font-semibold lg:inline">{user?.name}</span>
                </button>
                {userOpen ? (
                  <div className="absolute left-0 top-full z-40 mt-2 w-52 rounded-xl border border-line bg-sheet py-2 shadow-lg" role="menu">
                    <p className="px-3 py-1 text-xs text-muted">نقش: {role.name}</p>
                    <div className="my-1 border-t border-line md:hidden">
                      <p className="px-3 py-1 text-[11px] font-semibold text-muted">تغییر نقش</p>
                      {data.roles.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          role="menuitem"
                          className={cn("block w-full px-3 py-2 text-right text-sm hover:bg-sand", item.id === role.id && "font-semibold text-primary")}
                          onClick={() => {
                            setRole(item.id);
                            setUserOpen(false);
                          }}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                    <Link href="/site" className="block px-3 py-2 text-sm hover:bg-sand" role="menuitem" onClick={() => setUserOpen(false)}>
                      خروجی سایت
                    </Link>
                    <Link href="/infra/system" className="block px-3 py-2 text-sm hover:bg-sand" role="menuitem" onClick={() => setUserOpen(false)}>
                      تنظیمات سیستم
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="hidden border-t border-line/80 bg-paper/50 px-4 py-1.5 lg:block">
            <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted" aria-label="تاریخ امروز">
              {dates.map((item) => (
                <li key={item.label}>
                  <span className="font-semibold text-ink/70">{item.label}:</span> {item.text}
                </li>
              ))}
              <LiveClock />
            </ul>
          </div>
        </header>
        <main className="px-4 py-6 pb-16 lg:px-8">{canAccessPath(data, path) ? children : <UnauthorizedPanel />}</main>
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
                className="w-full rounded-full border border-line bg-paper px-4 py-2 text-sm"
                aria-label="جستجوی بخش"
              />
            </div>
            <nav className="admin-nav-scroll flex-1 overflow-y-auto px-2 pb-8">
              <NavList query={query} onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
