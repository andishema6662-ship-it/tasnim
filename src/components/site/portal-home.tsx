"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CoverThumb } from "@/components/cover-thumb";
import { featuredPhotoAlbums, publishedAlbums } from "@/lib/albums";
import { faDate, faNum } from "@/lib/format";
import {
  resolveHomepageSlots,
  slotCategoryShowcaseBlocks,
  slotEditorialItems,
  slotFeaturedSideItems,
  slotHeroItem,
  slotHotStories,
  slotModernGridLeadItems,
} from "@/lib/homepage-slots";
import { portalItemKey } from "@/lib/portal-slot-items";
import { publishedStories } from "@/lib/site";
import { portalBannerAds } from "@/lib/site-portal";
import { resolveTemplateSettings } from "@/lib/template";
import { useNewsroom } from "@/lib/store";
import { categoryName } from "@/lib/workflow";
import { GridPortalItem, HeroPortalItem, ListPortalItem, SidePortalItem } from "./portal-item-cards";
import { PortalLayout } from "./portal-layout";
import { PortalWidgetsSidebar } from "./portal-widgets";

const accent = "text-[var(--portal-primary)]";
const accentBorder = "border-[var(--portal-primary)]";
const accentHover = "hover:text-[var(--portal-primary)]";

export function SiteHomeView() {
  const { data } = useNewsroom();
  const theme = resolveTemplateSettings(data);
  const slots = resolveHomepageSlots(theme);
  const layout = theme.homeLayout;
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const cat = searchParams.get("cat") ?? "";
  const stories = useMemo(() => {
    let list = publishedStories(data);
    if (q) list = list.filter((story) => story.title.includes(q) || story.lead.includes(q));
    if (cat) list = list.filter((story) => story.categoryId === cat);
    return list;
  }, [data, q, cat]);
  const heroItem = slotHeroItem(data, slots);
  const sideItems = slotFeaturedSideItems(data, slots, heroItem);
  const gridLead = slotModernGridLeadItems(data, slots, heroItem);
  const hot = slotHotStories(data, slots);
  const editorial = slotEditorialItems(data, slots);
  const categoryBlocks = slotCategoryShowcaseBlocks(data, slots);
  const albums = publishedAlbums(data);
  const featuredAlbums = featuredPhotoAlbums(data);
  const photoSource = slots.photos.featuredOnly && featuredAlbums.length ? featuredAlbums : albums;
  const photoAlbums = photoSource.slice(0, Math.max(1, slots.photos.limit));
  const videos = data.videos.filter((item) => item.published).slice(0, Math.max(1, slots.multimedia.limit));
  const midAd = portalBannerAds(data)[1];
  const featuredDossiers = data.specialDossiers?.filter((item) => item.featuredOnHome) ?? [];
  const sectionTitle = `border-r-4 ${accentBorder} pr-3 text-lg font-bold`;

  const leadSection = !heroItem ? (
    <div className="rounded-lg border border-line bg-sheet p-8 text-center text-muted">خبر منتشرشده‌ای نیست.</div>
  ) : layout === "modern-grid" ? (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {gridLead.map((item) => (
        <div key={portalItemKey(item)}>
          <GridPortalItem data={data} item={item} />
        </div>
      ))}
    </section>
  ) : layout === "magazine" ? (
    <section className="space-y-4">
      <HeroPortalItem data={data} item={heroItem} tall={false} />
      <ul className="flex gap-3 overflow-x-auto pb-1">
        {sideItems.map((item) => (
          <li key={portalItemKey(item)} className="w-72 shrink-0">
            <SidePortalItem data={data} item={item} />
          </li>
        ))}
      </ul>
    </section>
  ) : (
    <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div data-testid="portal-hero">
        <HeroPortalItem data={data} item={heroItem} tall={true} />
      </div>
      <div data-testid="portal-featured-side">
        <ul className="flex flex-col gap-3">
          {sideItems.map((item) => (
            <li key={portalItemKey(item)}>
              <SidePortalItem data={data} item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );

  const hotAndFeaturedOrder =
    layout === "magazine" ? (
      <>
        <section className="lg:col-span-2">
          <h2 className={sectionTitle}>برگزیده‌های تحریریه</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editorial.map((item) => (
              <li key={portalItemKey(item)}>
                <GridPortalItem data={data} item={item} />
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className={sectionTitle}>پربازدیدترین‌ها</h2>
          <ol className="mt-4 space-y-3">
            {hot.map((story, index) => (
              <li key={story.id} className="flex gap-2 text-sm">
                <span className={`text-lg font-black text-[var(--portal-primary)]/40`}>{faNum(index + 1)}</span>
                <Link href={`/site/${story.id}`} className={`font-semibold leading-6 ${accentHover}`}>{story.title}</Link>
              </li>
            ))}
          </ol>
        </section>
      </>
    ) : (
      <>
        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className={sectionTitle}>پربازدیدترین‌ها</h2>
          <ol className="mt-4 space-y-3">
            {hot.map((story, index) => (
              <li key={story.id} className="flex gap-2 text-sm">
                <span className={`text-lg font-black text-[var(--portal-primary)]/40`}>{faNum(index + 1)}</span>
                <Link href={`/site/${story.id}`} className={`font-semibold leading-6 ${accentHover}`}>{story.title}</Link>
              </li>
            ))}
          </ol>
        </section>
        <section className="lg:col-span-2">
          <h2 className={sectionTitle}>برگزیده‌های تحریریه</h2>
          <ul className={`mt-4 grid gap-4 ${layout === "modern-grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
            {editorial.map((item) => (
              <li key={portalItemKey(item)}>
                <GridPortalItem data={data} item={item} />
              </li>
            ))}
          </ul>
        </section>
      </>
    );

  return (
    <PortalLayout>
      {q || cat ? (
        <p className="mb-4 rounded-md bg-sheet px-3 py-2 text-sm text-muted">
          {q ? `نتایج جستجو برای «${q}»` : `فیلتر: ${categoryName(data, cat)}`} — {faNum(stories.length)} خبر
        </p>
      ) : null}
      {featuredDossiers.length ? (
        <section className="mb-6 rounded-lg border border-line bg-white p-4 shadow-sm" data-testid="portal-featured-dossiers">
          <h2 className={sectionTitle}>پرونده‌های ویژه</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {featuredDossiers.map((dossier) => (
              <li key={dossier.id}>
                <Link href={`/site/dossier/${dossier.id}`} className="flex gap-3 rounded border border-line p-3 hover:border-[var(--portal-primary)]">
                  <CoverThumb cover={dossier.poster} className="h-20 w-28 shrink-0" />
                  <div>
                    <h3 className="font-bold leading-7">{dossier.title}</h3>
                    <p className="line-clamp-2 text-sm text-muted">{dossier.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div>{leadSection}</div>
        <PortalWidgetsSidebar />
      </div>
      {midAd?.image ? (
        <div className="my-6 overflow-hidden rounded-lg border border-line bg-white p-2">
          <a href={midAd.href || "#"}><CoverThumb cover={midAd.image} className="mx-auto h-24 max-w-[728px] w-full" /></a>
        </div>
      ) : (
        <div className="my-6 flex h-24 items-center justify-center rounded-lg border border-dashed border-line bg-white text-xs text-muted">تبلیغ میان‌صفحه</div>
      )}
      <div className={`grid gap-6 ${layout === "magazine" ? "lg:grid-cols-[2fr_1fr]" : "lg:grid-cols-3"}`}>{hotAndFeaturedOrder}</div>
      <div className={`mt-8 grid gap-6 ${layout === "modern-grid" ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {categoryBlocks.map((block) => (
          <section
            key={block.key}
            data-testid={`portal-category-block-${block.key}`}
            className="rounded-lg border border-line bg-white p-4 shadow-sm"
          >
            <h2 className="flex items-center justify-between border-b border-line pb-2 text-base font-bold">
              {block.label}
              {block.key.startsWith("cat-") ? (
                <Link href={`/site?cat=${block.key}`} className={`text-xs ${accent}`}>همه</Link>
              ) : null}
            </h2>
            <ul className="mt-3 space-y-3">
              {block.items.map((item) => (
                <li key={portalItemKey(item)}>
                  <ListPortalItem data={data} item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section id="photos" className="mt-10 scroll-mt-24">
        <h2 className={sectionTitle}>گزارش‌های تصویری</h2>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {photoAlbums.map((album) => (
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
        <h2 className={sectionTitle}>فیلم و صوت</h2>
        {!slots.multimedia.enabled ? (
          <p className="mt-3 text-sm text-muted">نمایش بخش چندرسانه‌ای در قالب غیرفعال است.</p>
        ) : videos.length ? (
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
