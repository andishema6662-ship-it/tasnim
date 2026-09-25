"use client";

import Link from "next/link";
import { faDate, faNum } from "@/lib/format";
import { hrefFor } from "@/lib/modules";
import { useNewsroom } from "@/lib/store";
import { categoryName, currentRole, STATUSES, statusLabel } from "@/lib/workflow";
import { StatusBadge } from "./ui";

const shortcuts = [
  { href: "/editorial/cartable", label: "کارتابل" },
  { href: "/editorial/cartable?view=queue", label: "صف سردبیری" },
  { href: "/editorial/ai", label: "دستیار تحریریه" },
  { href: "/editorial/order", label: "ترتیب خروجی" },
  { href: "/media/albums", label: "آلبوم‌ها" },
  { href: "/structure/categories", label: "دسته‌ها" },
];

export function Dashboard() {
  const { data } = useNewsroom();
  const role = currentRole(data);
  const recent = [...data.stories].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const waiting = [
    { label: "ارسال تازه‌خبر", value: data.submissions.filter((item) => item.status === "new").length, href: "/editorial/submissions" },
    { label: "پیشنهاد باز", value: data.suggestions.filter((item) => item.status === "pending").length, href: "/editorial/suggestions" },
    { label: "نظر در انتظار", value: data.comments.filter((item) => item.status === "pending").length, href: "/audience/comments" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-semibold text-rule">پیشخوان</p>
        <h1 className="text-2xl font-bold">خط تولید خبر</h1>
        <p className="mt-1 max-w-2xl text-sm leading-7 text-muted">
          نقش فعلی {role.name} است. خبرنگار پیش‌نویس را می‌فرستد، سردبیر بازبینی می‌کند و مدیر مسئول منتشر می‌کند.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((status) => {
          const count = data.stories.filter((story) => story.status === status).length;
          return (
            <Link key={status} href={`/editorial/cartable?status=${status}`} className="rounded-lg border border-line bg-sheet px-3 py-3 hover:border-ink">
              <p className="text-2xl font-bold">{faNum(count)}</p>
              <p className="text-xs text-muted">{statusLabel(data, status)}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section className="rounded-lg border border-line bg-sheet">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-bold">آخرین خبرها</h2>
            <Link href="/editorial/cartable" className="text-sm text-rule">
              همه خبرها
            </Link>
          </div>
          <ul>
            {recent.map((story) => (
              <li key={story.id} className="border-b border-line px-4 py-3 last:border-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <StatusBadge status={story.status} label={statusLabel(data, story.status)} />
                  <span>{categoryName(data, story.categoryId)}</span>
                  <span>{story.author}</span>
                  <span>{faDate(story.updatedAt)}</span>
                </div>
                <Link href={`/editorial/cartable/${story.id}`} className="mt-1 block font-semibold leading-7 hover:text-rule">
                  {story.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <aside className="space-y-3">
          <section className="rounded-lg border border-line bg-sheet p-4">
            <h2 className="font-bold">در انتظار میز</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {waiting.map((item) => (
                <li key={item.href} className="flex items-center justify-between gap-3">
                  <Link href={item.href} className="hover:text-rule">
                    {item.label}
                  </Link>
                  <span className="font-semibold">{faNum(item.value)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-line bg-sheet p-4">
            <h2 className="font-bold">میانبر</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {shortcuts.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-rule">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-line bg-sheet p-4 text-sm leading-7">
            <h2 className="font-bold">شش گروه منو</h2>
            <ul className="mt-2 space-y-1">
              {[
                ["core", "system"],
                ["editorial", "cartable"],
                ["media", "albums"],
                ["audience", "comments"],
                ["reports", "news-report"],
                ["structure", "categories"],
              ].map(([group, slug]) => (
                <li key={group}>
                  <Link href={hrefFor(group, slug)} className="hover:text-rule">
                    {group === "core" && "هسته مدیریتی"}
                    {group === "editorial" && "تحریریه و تولید"}
                    {group === "media" && "رسانه‌های مکمل"}
                    {group === "audience" && "تعامل با مخاطب"}
                    {group === "reports" && "تحلیل و گزارش"}
                    {group === "structure" && "ساختار و انتشار"}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
