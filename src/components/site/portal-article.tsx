"use client";

import Link from "next/link";
import { useState } from "react";
import { CoverThumb } from "@/components/cover-thumb";
import { faDate, faNum, wordCountFromHtml } from "@/lib/format";
import { uid } from "@/lib/id";
import { isCoverImage, storyBodyHtml } from "@/lib/site";
import { approvedCommentsForStory, relatedStories, storyCategoryLabel, storyServiceLabel } from "@/lib/site-portal";
import { useNewsroom } from "@/lib/store";
import { PortalLayout } from "./portal-layout";

export function SiteArticleView({ id }: { id: string }) {
  const { data, update } = useNewsroom();
  const story = data.stories.find((item) => item.id === id && item.status === "published");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [flash, setFlash] = useState("");

  if (!story) {
    return (
      <PortalLayout>
        <h1 className="text-xl font-bold">این خبر در خروجی عمومی نیست</h1>
        <Link href="/site" className="mt-4 inline-block text-sm text-[var(--portal-primary)]">بازگشت به صفحه اصلی</Link>
      </PortalLayout>
    );
  }

  const storyId = story.id;
  const comments = approvedCommentsForStory(data, storyId);
  const related = relatedStories(data, story);
  const words = wordCountFromHtml(story.body) + wordCountFromHtml(story.lead);
  const readingMin = Math.max(1, Math.ceil(words / 180));
  const published = story.publishedAt ?? story.updatedAt;
  const time = new Date(published).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

  function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!author.trim() || !body.trim()) {
      setFlash("نام و متن نظر را بنویسید.");
      return;
    }
    update((current) => ({
      ...current,
      comments: [
        {
          id: uid("c"),
          storyId,
          author: author.trim(),
          body: body.trim(),
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        ...current.comments,
      ],
    }));
    setAuthor("");
    setBody("");
    setFlash("نظر شما ثبت شد و پس از تأیید تحریریه نمایش داده می‌شود.");
  }

  return (
    <PortalLayout>
      <nav className="text-sm text-muted" aria-label="مسیر">
        <Link href="/site" className="hover:text-[var(--portal-primary)]">خانه</Link>
        <span className="mx-2">›</span>
        <Link href={`/site?cat=${story.categoryId}`} className="hover:text-[var(--portal-primary)]">{storyCategoryLabel(data, story)}</Link>
        <span className="mx-2">›</span>
        <span className="text-ink">{story.title}</span>
      </nav>
      <article className="mt-4 rounded-lg border border-line bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <p className="text-sm font-semibold text-[var(--portal-primary)]">{storyServiceLabel(data, story)}</p>
        <h1 className="mt-2 text-3xl font-black leading-snug sm:text-4xl">{story.title}</h1>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li>{faDate(published)} · {time}</li>
          <li>نویسنده: {story.author}</li>
          <li>زمان مطالعه: حدود {faNum(readingMin)} دقیقه</li>
          <li>{faNum(words)} کلمه</li>
        </ul>
        <blockquote className="mt-6 border-r-4 border-[var(--portal-primary)] bg-[#fdf8f8] px-4 py-3 text-lg leading-9 text-ink/90">{story.lead}</blockquote>
        {isCoverImage(story.cover) ? (
          <figure className="mt-6">
            <CoverThumb cover={story.cover} className="w-full max-h-[480px] rounded-lg object-cover" />
            <figcaption className="mt-2 text-center text-xs text-muted">عکس شاخص · {story.author}</figcaption>
          </figure>
        ) : null}
        <div
          className="prose-site mt-8 text-base leading-8 [&_a]:text-[var(--portal-primary)] [&_a]:underline [&_ol]:list-decimal [&_ol]:pr-8 [&_ul]:list-disc [&_ul]:pr-8"
          dangerouslySetInnerHTML={{ __html: storyBodyHtml(story.body) }}
        />
        {story.tags.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {story.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-sand px-3 py-1 text-xs">#{tag}</span>
            ))}
          </div>
        ) : null}
      </article>
      <section className="mt-8">
        <h2 className="border-r-4 border-[var(--portal-primary)] pr-3 text-lg font-bold">اخبار مرتبط</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {related.map((item) => (
            <li key={item.id}>
              <Link href={`/site/${item.id}`} className="block rounded border border-line bg-white p-3 text-sm font-semibold hover:border-[var(--portal-primary)]/40">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10 rounded-lg border border-line bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">نظرات مخاطبان</h2>
        {flash ? <p className="mt-2 text-sm text-muted">{flash}</p> : null}
        <ul className="mt-4 space-y-3">
          {comments.length === 0 ? <li className="text-sm text-muted">هنوز نظر تأییدشده‌ای نیست.</li> : null}
          {comments.map((comment) => (
            <li key={comment.id} className="rounded border border-line bg-paper px-3 py-2 text-sm">
              <p className="font-semibold">{comment.author}</p>
              <p className="mt-1 leading-7">{comment.body}</p>
              <p className="mt-1 text-xs text-muted">{faDate(comment.createdAt)}</p>
            </li>
          ))}
        </ul>
        <form className="mt-6 space-y-3 border-t border-line pt-4" onSubmit={submitComment}>
          <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="نام شما" className="w-full rounded border border-line px-3 py-2 text-sm" aria-label="نام" />
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder="نظر خود را بنویسید…" className="w-full rounded border border-line px-3 py-2 text-sm" aria-label="متن نظر" />
          <button type="submit" className="rounded bg-[var(--portal-primary)] px-4 py-2 text-sm text-white">ارسال نظر</button>
        </form>
      </section>
    </PortalLayout>
  );
}
