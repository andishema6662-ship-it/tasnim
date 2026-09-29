"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CoverThumb } from "@/components/cover-thumb";
import { PortalLayout } from "@/components/site/portal-layout";
import { faDate } from "@/lib/format";
import { publishedStories } from "@/lib/site";
import { useNewsroom } from "@/lib/store";

export default function DossierPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data } = useNewsroom();
  const dossier = data.specialDossiers?.find((item) => item.id === id);
  const stories = publishedStories(data).filter((story) => dossier?.storyIds.includes(story.id));

  if (!dossier) {
    return (
      <PortalLayout>
        <p className="rounded-lg border border-line bg-white p-8 text-center">پرونده پیدا نشد.</p>
        <Link href="/site" className="mt-4 inline-block text-accent">بازگشت به صفحه اصلی</Link>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <article className="rounded-lg border border-line bg-white p-6 shadow-sm" data-testid="dossier-page">
        <div className="flex flex-col gap-4 sm:flex-row">
          <CoverThumb cover={dossier.poster} className="h-48 w-full max-w-xs rounded" />
          <div>
            <h1 className="text-2xl font-black text-[var(--portal-primary)]">{dossier.title}</h1>
            <p className="mt-3 leading-8 text-muted">{dossier.description}</p>
            {dossier.tags.length ? (
              <p className="mt-2 text-sm">{dossier.tags.map((tag) => `#${tag}`).join(" ")}</p>
            ) : null}
          </div>
        </div>
        <h2 className="mt-8 border-r-4 border-[var(--portal-primary)] pr-3 text-lg font-bold">اخبار پرونده</h2>
        <ul className="mt-4 space-y-4">
          {stories.length === 0 ? <li className="text-sm text-muted">خبر منتشرشده‌ای به این پرونده وصل نشده است.</li> : null}
          {stories.map((story) => (
            <li key={story.id}>
              <Link href={`/site/${story.id}`} className="block rounded border border-line p-4 hover:border-[var(--portal-primary)]">
                <h3 className="font-bold">{story.title}</h3>
                <p className="mt-1 text-sm text-muted">{story.lead}</p>
                <p className="mt-2 text-xs text-muted">{faDate(story.publishedAt ?? story.updatedAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </PortalLayout>
  );
}
