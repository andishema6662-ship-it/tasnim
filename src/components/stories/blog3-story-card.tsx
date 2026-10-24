"use client";

import Link from "next/link";
import { CoverThumb } from "@/components/cover-thumb";
import { faDate, faNum } from "@/lib/format";
import { estimateReadMinutes } from "@/lib/reporter-workspace";
import type { NewsroomData, Story } from "@/lib/types";
import { categoryName } from "@/lib/workflow";

type Blog3StoryCardProps = {
  data: NewsroomData;
  story: Story;
  href: string;
  commentCount?: number;
};

export function Blog3StoryCard({ data, story, href, commentCount }: Blog3StoryCardProps) {
  const comments =
    commentCount ??
    data.comments.filter((comment) => comment.storyId === story.id && comment.status === "approved").length;
  const readMin = estimateReadMinutes(`${story.lead} ${story.body}`);
  const person = data.people.find((p) => p.name === story.author);
  const date = story.publishedAt ?? story.updatedAt;

  return (
    <article className="blog-card-3 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md" data-testid="blog3-card">
      <Link href={href} className="block">
        <div className="aspect-[16/10] overflow-hidden bg-slate-100">
          <CoverThumb cover={story.cover} className="h-full w-full object-cover transition hover:scale-[1.02]" />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <time dateTime={date}>{faDate(date)}</time>
          <span className="rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-700">{categoryName(data, story.categoryId)}</span>
          <span>{faNum(readMin)} دقیقه خواندن</span>
        </div>
        <h3 className="mt-2 text-lg font-bold leading-8 text-slate-800">
          <Link href={href} className="hover:text-primary">{story.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-600">{story.lead}</p>
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            {person?.avatarUrl ? (
              <img src={person.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-violet-50" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                {story.author.slice(0, 1)}
              </span>
            )}
            <span className="font-medium text-slate-700">{story.author}</span>
          </div>
          <ul className="flex items-center gap-3">
            <li>{faNum(story.views)} بازدید</li>
            <li>{faNum(comments)} نظر</li>
          </ul>
        </footer>
      </div>
    </article>
  );
}
