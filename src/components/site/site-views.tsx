"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CoverThumb } from "@/components/cover-thumb";
import { faDate } from "@/lib/format";
import { useNewsroom } from "@/lib/store";
import { isCoverImage, publishedStories, storyBodyHtml } from "@/lib/site";

function SiteChrome({ children }: { children: ReactNode }) {
  const { data } = useNewsroom();
  const title = (data.settings.mediaName ?? "").trim() || data.settings.newsroomName;
  const subtitle = (data.settings.mediaDisplayTitle ?? "").trim() || data.settings.tagline;
  const mark = data.settings.brandMark ?? "";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-mast text-paper">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            {mark ? <img src={mark} alt="" className="h-10 w-10 rounded object-contain bg-white/10" /> : null}
            <div>
              <p className="text-xs text-white/70">{subtitle}</p>
              <Link href="/site" className="text-lg font-bold hover:text-white/90">{title}</Link>
            </div>
          </div>
          <Link href="/" className="rounded-md border border-white/25 px-3 py-1.5 text-xs hover:bg-white/10">
            پنل تحریریه
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      <footer className="border-t border-line px-4 py-6 text-center text-xs text-muted">خروجی عمومی · فقط اخبار منتشرشده</footer>
    </div>
  );
}

export function SiteHomeView() {
  const { data } = useNewsroom();
  const stories = publishedStories(data);

  return (
    <SiteChrome>
      <h1 className="text-2xl font-bold">آخرین اخبار</h1>
      <p className="mt-1 text-sm text-muted">فهرست خبرهای منتشرشده از همین مرورگر.</p>
      {stories.length === 0 ? <p className="mt-8 text-muted">فعلاً خبر منتشرشده‌ای نیست.</p> : null}
      <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-sheet">
        {stories.map((story) => (
          <li key={story.id} className="px-4 py-4">
            <Link href={`/site/${story.id}`} className="group block">
              {isCoverImage(story.cover) ? <CoverThumb cover={story.cover} className="mb-3 h-40 w-full rounded-md" /> : null}
              <h2 className="text-lg font-bold leading-8 group-hover:text-rule">{story.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm leading-7 text-muted">{story.lead}</p>
              <p className="mt-2 text-xs text-muted">{story.author} · {faDate(story.publishedAt ?? story.updatedAt)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </SiteChrome>
  );
}

export function SiteArticleView({ id }: { id: string }) {
  const { data } = useNewsroom();
  const story = data.stories.find((item) => item.id === id && item.status === "published");

  if (!story) {
    return (
      <SiteChrome>
        <h1 className="text-xl font-bold">این خبر در خروجی عمومی نیست</h1>
        <p className="mt-2 text-sm text-muted">شاید هنوز منتشر نشده یا از خروجی برداشته شده است.</p>
        <Link href="/site" className="mt-4 inline-block text-sm text-rule">بازگشت به فهرست</Link>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <Link href="/site" className="text-sm text-rule">← فهرست اخبار</Link>
      <article className="mt-4">
        {isCoverImage(story.cover) ? <CoverThumb cover={story.cover} className="mb-4 h-56 w-full rounded-lg" /> : null}
        <h1 className="text-3xl font-bold leading-snug">{story.title}</h1>
        <p className="mt-2 text-sm text-muted">{story.author} · {faDate(story.publishedAt ?? story.updatedAt)}</p>
        <p className="mt-6 text-lg leading-9 text-ink/90">{story.lead}</p>
        <div
          className="mt-6 text-base leading-8 [&_a]:text-rule [&_a]:underline [&_ol]:list-decimal [&_ol]:pr-8 [&_ul]:list-disc [&_ul]:pr-8"
          dangerouslySetInnerHTML={{ __html: storyBodyHtml(story.body) }}
        />
      </article>
    </SiteChrome>
  );
}
