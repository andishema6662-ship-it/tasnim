"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PersonHexaCard } from "@/components/people/person-ui";
import { filterPeople, visiblePeople } from "@/lib/people";
import { useNewsroom } from "@/lib/store";
import { PortalLayout } from "./portal-layout";

export function SitePeopleView() {
  const { data } = useNewsroom();
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const visible = visiblePeople(data);
  const kinds = useMemo(() => [...new Set(visible.map((p) => p.kind))].sort(), [visible]);
  const filtered = useMemo(() => filterPeople(visible, query, kindFilter), [visible, query, kindFilter]);

  return (
    <PortalLayout>
      <nav className="text-sm text-muted">
        <Link href="/site" className="hover:text-[var(--portal-primary)]">خانه</Link>
        <span className="mx-2">›</span>
        <span>معرفی عوامل</span>
      </nav>
      <header className="mt-4 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-800">معرفی افراد و دست‌اندرکاران</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
          هیئت تحریریه و عوامل خبرگزاری شمسه — مدیر مسئول، سردبیر، دبیران، خبرنگاران، عکاسان و تیم چندرسانه‌ای.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجو بر اساس نام"
            className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm sm:max-w-xs"
            aria-label="جستجو بر اساس نام"
          />
          <select
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value)}
            className="rounded-lg border border-line bg-paper px-3 py-2 text-sm sm:max-w-[12rem]"
            aria-label="فیلتر نقش"
          >
            <option value="all">همه نقش‌ها</option>
            {kinds.map((kind) => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
          </select>
        </div>
      </header>
      <div className="mt-6 grid gap-6 md:grid-cols-2" data-testid="site-people-grid">
        {filtered.map((person) => (
          <PersonHexaCard key={person.id} data={data} person={person} mode="portal" />
        ))}
      </div>
      {!filtered.length ? <p className="mt-8 text-center text-sm text-muted">عضوی برای نمایش ثبت نشده است.</p> : null}
    </PortalLayout>
  );
}
