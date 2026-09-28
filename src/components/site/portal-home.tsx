"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CoverThumb } from "@/components/cover-thumb";
import { featuredPhotoAlbums, publishedAlbums } from "@/lib/albums";
import { faDate, faNum } from "@/lib/format";
import { isCoverImage, publishedStories } from "@/lib/site";
import {
  PORTAL_NAV,
  featuredStory,
  portalBannerAds,
  storiesByCategory,
  storyCategoryLabel,
  topViewedStories,
} from "@/lib/site-portal";
import { useNewsroom } from "@/lib/store";
import { categoryName } from "@/lib/workflow";
import { PortalLayout } from "./portal-layout";

export function SiteHomeView() {
  const { data } = useNewsroom();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const cat = searchParams.get("cat") ?? "";
  const stories = useMemo(() => {
    let list = publishedStories(data);
    if (q) list = list.filter((story) => story.title.includes(q) || story.lead.includes(q));
    if (cat) list = list.filter((story) => story.categoryId === cat);
    return list;
  }, [data, q, cat]);
  const hero = featuredStory(data);
  const side = stories.filter((story) => story.id !== hero?.id).slice(0, 3);
  const hot = topViewedStories(data);
  const albums = publishedAlbums(data);
  const featuredAlbums = featuredPhotoAlbums(data);
  const videos = data.videos.filter((item) => item.published);
  const midAd = portalBannerAds(data)[1];

  return (
    <PortalLayout>
      {q || cat ? (
        <p className="mb-4 rounded-md bg-sheet px-3 py-2 text-sm text-muted">
          {q ? `نتایج جستجو برای «${q}»` : `فیلتر: ${categoryName(data, cat)}`} — {faNum(stories.length)} خبر
        </p>
      ) : null}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {hero ? (
          <Link href={`/site/${hero.id}`} className="group relative min-h-[280px] overflow-hidden rounded-lg shadow-lg sm:min-h-[360px]">
            <CoverThumb cover={hero.cover} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <span className="rounded bg-[#c41e3a] px-2 py-0.5 text-xs font-bold">{storyCategoryLabel(data, hero)}</span>
              <h1 className="mt-2 text-2xl font-black leading-10 sm:text-3xl">{hero.title}</h1>
              <p className="mt-2 line-clamp-2 text-sm leading-7 text-white/85">{hero.lead}</p>
            </div>
          </Link>
        ) : (
          <div className="rounded-lg border border-line bg-sheet p-8 text-center text-muted">خبر منتشرشده‌ای نیست.</div>
        )}
        <ul className="flex flex-col gap-3">
          {side.map((story) => (
            <li key={story.id}>
              <Link href={`/site/${story.id}`} className="flex gap-3 rounded-lg border border-line bg-white p-2 shadow-sm hover:border-[#8e1e2d]/40">
                {isCoverImage(story.cover) ? <CoverThumb cover={story.cover} className="h-20 w-28 shrink-0 rounded" /> : <div className="h-20 w-28 shrink-0 rounded bg-sand" />}
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#8e1e2d]">{storyCategoryLabel(data, story)}</p>
                  <h2 className="line-clamp-2 text-sm font-bold leading-6">{story.title}</h2>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{story.lead}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {midAd?.image ? (
        <div className="my-6 overflow-hidden rounded-lg border border-line bg-white p-2">
          <a href={midAd.href || "#"}><CoverThumb cover={midAd.image} className="mx-auto h-24 max-w-[728px] w-full" /></a>
        </div>
      ) : (
        <div className="my-6 flex h-24 items-center justify-center rounded-lg border border-dashed border-line bg-white text-xs text-muted">تبلیغ میان‌صفحه</div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="border-r-4 border-[#8e1e2d] pr-3 text-lg font-bold">پربازدیدترین‌ها</h2>
          <ol className="mt-4 space-y-3">
            {hot.map((story, index) => (
              <li key={story.id} className="flex gap-2 text-sm">
                <span className="text-lg font-black text-[#8e1e2d]/40">{faNum(index + 1)}</span>
                <Link href={`/site/${story.id}`} className="font-semibold leading-6 hover:text-[#8e1e2d]">{story.title}</Link>
              </li>
            ))}
          </ol>
        </section>
        <section className="lg:col-span-2">
          <h2 className="border-r-4 border-[#8e1e2d] pr-3 text-lg font-bold">برگزیده‌های تحریریه</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {stories.slice(0, 6).map((story) => (
              <li key={story.id}>
                <Link href={`/site/${story.id}`} className="block overflow-hidden rounded-lg border border-line bg-white shadow-sm">
                  {isCoverImage(story.cover) ? <CoverThumb cover={story.cover} className="h-36 w-full" /> : null}
                  <div className="p-3">
                    <p className="text-xs text-[#8e1e2d]">{storyCategoryLabel(data, story)}</p>
                    <h3 className="mt-1 line-clamp-2 font-bold leading-6">{story.title}</h3>
                    <p className="mt-1 text-xs text-muted">{faDate(story.publishedAt ?? story.updatedAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {PORTAL_NAV.filter((item): item is Extract<typeof item, { categoryId: string }> => "categoryId" in item && Boolean(item.categoryId)).slice(0, 4).map((nav) => (
          <section key={nav.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
            <h2 className="flex items-center justify-between border-b border-line pb-2 text-base font-bold">
              {nav.label}
              <Link href={`/site?cat=${nav.categoryId}`} className="text-xs text-[#8e1e2d]">همه</Link>
            </h2>
            <ul className="mt-3 space-y-3">
              {storiesByCategory(data, nav.categoryId, 4).map((story) => (
                <li key={story.id}>
                  <Link href={`/site/${story.id}`} className="flex gap-3 hover:text-[#8e1e2d]">
                    {isCoverImage(story.cover) ? <CoverThumb cover={story.cover} className="h-16 w-24 shrink-0 rounded" /> : null}
                    <div>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-6">{story.title}</h3>
                      <p className="text-xs text-muted">{faDate(story.publishedAt ?? story.updatedAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section id="photos" className="mt-10 scroll-mt-24">
        <h2 className="border-r-4 border-[#8e1e2d] pr-3 text-lg font-bold">گزارش‌های تصویری</h2>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {(featuredAlbums.length ? featuredAlbums : albums).slice(0, 5).map((album) => (
            <Link key={album.id} href={`/site/album/${album.id}`} className="w-64 shrink-0 overflow-hidden rounded-lg border border-line bg-white shadow-sm">
              <CoverThumb cover={album.photos[0]?.src ?? "sand"} className="h-40 w-full" />
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-bold">{album.title}</h3>
                <p className="text-xs text-muted">عکاس: {album.photographer}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section id="multimedia" className="mt-10 scroll-mt-24 rounded-lg border border-line bg-white p-4 shadow-sm">
        <h2 className="border-r-4 border-[#8e1e2d] pr-3 text-lg font-bold">فیلم و صوت</h2>
        {videos.length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {videos.map((video) => (
              <li key={video.id} className="rounded border border-line p-3">
                <p className="font-semibold">{video.title}</p>
                <p className="text-xs text-muted">{video.duration} · {video.summary}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">ویدئوی منتشرشده‌ای ثبت نشده است.</p>
        )}
      </section>
    </PortalLayout>
  );
}
