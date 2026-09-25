"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { faDate, faNum, norm } from "@/lib/format";
import { useNewsroom } from "@/lib/store";
import type { Status, Story } from "@/lib/types";
import { applyStatus, canPublishCategory, categoryName, currentRole, STATUSES, statusLabel, transitionsFrom } from "@/lib/workflow";
import { Button, Empty, Flash, Input, ModulePage, Select, StatusBadge } from "../ui";

const queueStatuses: Status[] = ["editing", "review", "ready"];

export function CartableScreen() {
  const params = useSearchParams();
  const { data, commitStory } = useNewsroom();
  const role = currentRole(data);
  const [view, setView] = useState(params.get("view") === "queue" ? "queue" : "list");
  const [status, setStatus] = useState(params.get("status") ?? "all");
  const [categoryId, setCategoryId] = useState("all");
  const [author, setAuthor] = useState("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [flash, setFlash] = useState("");

  const authors = useMemo(() => [...new Set(data.stories.map((story) => story.author))].sort((a, b) => a.localeCompare(b, "fa")), [data.stories]);

  const filtered = data.stories.filter((story) => {
    if (status !== "all" && story.status !== status) return false;
    if (categoryId !== "all" && story.categoryId !== categoryId) return false;
    if (author !== "all" && story.author !== author) return false;
    if (!query.trim()) return true;
    const hay = norm(`${story.title} ${story.lead} ${story.body} ${story.tags.join(" ")}`);
    return hay.includes(norm(query));
  });
  const visible = showAll ? filtered : filtered.slice(0, Math.max(1, data.settings.pageSize));

  function act(story: Story, to: Status) {
    if (to === "published" && !canPublishCategory(data, story.categoryId)) {
      setFlash("انتشار این دسته برای نقش شما بسته است.");
      return;
    }
    const label = data.transitions.find((item) => item.from === story.status && item.to === to)?.label ?? statusLabel(data, to);
    commitStory(applyStatus(story, to), { promote: to === "published", log: `${label}: ${story.title}` });
    setFlash(`${label} انجام شد: ${story.title}`);
  }

  return (
    <ModulePage
      slug="cartable"
      actions={
        <Link href="/editorial/cartable/new" className="rounded-md bg-ink px-3 py-2 text-sm text-sheet">
          خبر جدید
        </Link>
      }
    >
      <p className="text-sm text-muted">نقش فعلی: {role.name}. دکمه‌های هر خبر به همین نقش وابسته‌اند.</p>
      <div className="flex gap-2">
        <Button tone={view === "list" ? "primary" : "ghost"} onClick={() => setView("list")}>
          فهرست
        </Button>
        <Button tone={view === "queue" ? "primary" : "ghost"} onClick={() => setView("queue")}>
          صف سردبیری
        </Button>
      </div>
      <Flash>{flash}</Flash>

      {view === "list" ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در عنوان، لید و برچسب" aria-label="جستجو" />
            <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="وضعیت">
              <option value="all">همه وضعیت‌ها</option>
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {statusLabel(data, item)}
                </option>
              ))}
            </Select>
            <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="دسته">
              <option value="all">همه دسته‌ها</option>
              {data.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select value={author} onChange={(event) => setAuthor(event.target.value)} aria-label="نویسنده">
              <option value="all">همه نویسندگان</option>
              {authors.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          {visible.length === 0 ? <Empty>خبری با این مشخصات پیدا نشد.</Empty> : null}
          <div className="divide-y divide-line rounded-lg border border-line bg-sheet">
            {visible.map((story) => (
              <article key={story.id} className="px-4 py-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <StatusBadge status={story.status} label={statusLabel(data, story.status)} />
                  <span>{categoryName(data, story.categoryId)}</span>
                  <span>{story.author}</span>
                  <span>{faDate(story.updatedAt)}</span>
                </div>
                <Link href={`/editorial/cartable/${story.id}`} className="mt-1 block text-lg font-bold leading-8 hover:text-rule">
                  {story.title}
                </Link>
                <p className="line-clamp-2 text-sm text-muted">{story.lead}</p>
              </article>
            ))}
          </div>
          {filtered.length > visible.length ? (
            <Button tone="ghost" onClick={() => setShowAll(true)}>
              نمایش همه ({faNum(filtered.length)})
            </Button>
          ) : null}
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {queueStatuses.map((status) => {
            const items = data.stories.filter((story) => story.status === status);
            return (
              <section key={status} className="rounded-lg border border-line bg-sheet p-3">
                <h2 className="font-bold">
                  {statusLabel(data, status)} <span className="text-sm font-normal text-muted">{faNum(items.length)}</span>
                </h2>
                <div className="mt-3 space-y-3">
                  {items.length === 0 ? <p className="text-sm text-muted">خبری در این مرحله نیست.</p> : null}
                  {items.map((story) => {
                    const actions = transitionsFrom(data, story.status);
                    return (
                      <article key={story.id} className="rounded-md border border-line p-3">
                        <Link href={`/editorial/cartable/${story.id}`} className="font-semibold leading-7 hover:text-rule">
                          {story.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted">
                          {story.author} · {categoryName(data, story.categoryId)}
                        </p>
                        <div className="mt-2 flex flex-col gap-2">
                          {actions.length === 0 ? <p className="text-xs text-muted">اقدامی برای نقش شما در این مرحله نیست.</p> : null}
                          {actions.map((transition) => (
                            <Button key={transition.id} tone={transition.to === "published" ? "accent" : "ghost"} onClick={() => act(story, transition.to)}>
                              {transition.label}
                            </Button>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </ModulePage>
  );
}
