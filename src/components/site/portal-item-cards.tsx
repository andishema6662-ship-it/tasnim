"use client";

import Link from "next/link";
import { CoverThumb } from "@/components/cover-thumb";
import { faDate } from "@/lib/format";
import type { PortalItem } from "@/lib/portal-slot-items";
import type { NewsroomData } from "@/lib/types";
import { isCoverImage } from "@/lib/site";
import { storyCategoryLabel } from "@/lib/site-portal";

const accent = "text-[var(--portal-primary)]";
const accentBadge = "bg-[var(--portal-accent)]";

export function ExternalSourceBadge({ name }: { name: string }) {
  return (
    <span className="rounded border border-[var(--portal-primary)]/30 bg-[var(--portal-primary)]/5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--portal-primary)]">
      منبع: {name}
    </span>
  );
}

export function HeroPortalItem({
  data,
  item,
  tall,
}: {
  data: NewsroomData;
  item: PortalItem;
  tall: boolean;
}) {
  if (item.type === "story") {
    const hero = item.story;
    return (
      <Link
        href={`/${hero.id}`}
        className={`group relative overflow-hidden rounded-lg shadow-lg ${tall ? "min-h-[280px] sm:min-h-[360px]" : "min-h-[200px] sm:min-h-[260px]"}`}
      >
        <CoverThumb cover={hero.cover} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${accentBadge}`}>{storyCategoryLabel(data, hero)}</span>
          <h1 className={`mt-2 font-black leading-10 text-white ${tall ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>{hero.title}</h1>
          <p className="mt-2 line-clamp-2 text-sm leading-7 text-white/85">{hero.lead}</p>
        </div>
      </Link>
    );
  }
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className={`group relative flex flex-col justify-end overflow-hidden rounded-lg border border-line bg-gradient-to-br from-[var(--portal-nav)] to-[var(--portal-primary)] shadow-lg ${tall ? "min-h-[280px] sm:min-h-[360px]" : "min-h-[200px] sm:min-h-[260px]"}`}
    >
      <div className="p-5 text-white">
        <ExternalSourceBadge name={item.sourceName} />
        <h1 className={`mt-2 font-black leading-10 ${tall ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>{item.title}</h1>
        <p className="mt-2 line-clamp-3 text-sm leading-7 text-white/85">{item.summary}</p>
        <p className="mt-2 text-xs text-white/70">لینک خارجی ↗</p>
      </div>
    </a>
  );
}

export function SidePortalItem({ data, item }: { data: NewsroomData; item: PortalItem }) {
  if (item.type === "story") {
    const story = item.story;
    return (
      <Link
        href={`/${story.id}`}
        className="flex gap-3 rounded-lg border border-line bg-white p-2 shadow-sm hover:border-[var(--portal-primary)]/40"
      >
        {isCoverImage(story.cover) ? (
          <CoverThumb cover={story.cover} className="h-20 w-28 shrink-0 rounded" />
        ) : (
          <div className="h-20 w-28 shrink-0 rounded bg-sand" />
        )}
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold ${accent}`}>{storyCategoryLabel(data, story)}</p>
          <h2 className="line-clamp-2 text-sm font-bold leading-6">{story.title}</h2>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{story.lead}</p>
        </div>
      </Link>
    );
  }
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col gap-2 rounded-lg border border-dashed border-[var(--portal-primary)]/40 bg-white p-3 shadow-sm"
    >
      <ExternalSourceBadge name={item.sourceName} />
      <h2 className="line-clamp-2 text-sm font-bold leading-6">{item.title}</h2>
      <p className="line-clamp-2 text-xs text-muted">{item.summary}</p>
    </a>
  );
}

export function GridPortalItem({ data, item }: { data: NewsroomData; item: PortalItem }) {
  if (item.type === "story") {
    const story = item.story;
    return (
      <Link href={`/${story.id}`} className="block overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        {isCoverImage(story.cover) ? <CoverThumb cover={story.cover} className="h-36 w-full" /> : null}
        <div className="p-3">
          <p className={`text-xs ${accent}`}>{storyCategoryLabel(data, story)}</p>
          <h3 className="mt-1 line-clamp-2 font-bold leading-6">{story.title}</h3>
          <p className="mt-1 text-xs text-muted">{faDate(story.publishedAt ?? story.updatedAt)}</p>
        </div>
      </Link>
    );
  }
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-lg border border-line bg-white p-3 shadow-sm"
    >
      <ExternalSourceBadge name={item.sourceName} />
      <h3 className="mt-2 line-clamp-3 text-sm font-bold leading-6">{item.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-muted">{item.summary}</p>
    </a>
  );
}

export function ListPortalItem({ data, item }: { data: NewsroomData; item: PortalItem }) {
  if (item.type === "story") {
    const story = item.story;
    return (
      <Link href={`/${story.id}`} className={`flex gap-3 hover:text-[var(--portal-primary)]`}>
        {isCoverImage(story.cover) ? <CoverThumb cover={story.cover} className="h-16 w-24 shrink-0 rounded" /> : null}
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-6">{story.title}</h3>
          <p className="text-xs text-muted">{faDate(story.publishedAt ?? story.updatedAt)}</p>
        </div>
      </Link>
    );
  }
  return (
    <a href={item.href} target="_blank" rel="noreferrer" className="block text-sm">
      <ExternalSourceBadge name={item.sourceName} />
      <h3 className="mt-1 line-clamp-2 font-semibold leading-6">{item.title}</h3>
    </a>
  );
}
