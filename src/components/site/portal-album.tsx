"use client";

import Link from "next/link";
import { CoverThumb } from "@/components/cover-thumb";
import { faDate } from "@/lib/format";
import { useNewsroom } from "@/lib/store";
import { PortalLayout } from "./portal-layout";

export function SiteAlbumView({ id }: { id: string }) {
  const { data } = useNewsroom();
  const album = data.albums.find((item) => item.id === id && item.status === "published");

  if (!album) {
    return (
      <PortalLayout>
        <h1 className="text-xl font-bold">این گزارش تصویری در خروجی نیست</h1>
        <Link href="/site" className="mt-4 inline-block text-sm text-[#8e1e2d]">بازگشت</Link>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <nav className="text-sm text-muted">
        <Link href="/site" className="hover:text-[#8e1e2d]">خانه</Link>
        <span className="mx-2">›</span>
        <Link href="/site#photos" className="hover:text-[#8e1e2d]">گزارش تصویری</Link>
      </nav>
      <article className="mt-4 rounded-lg border border-line bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black leading-snug">{album.title}</h1>
        <p className="mt-2 text-sm text-muted">عکاس: {album.photographer} · {faDate(album.publishedAt ?? album.updatedAt)}</p>
        <p className="mt-4 text-base leading-8">{album.description}</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {album.photos.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-lg border border-line">
              <CoverThumb cover={photo.src} className="h-52 w-full" />
              {photo.caption ? <p className="px-3 py-2 text-sm">{photo.caption}</p> : null}
            </li>
          ))}
        </ul>
      </article>
    </PortalLayout>
  );
}
