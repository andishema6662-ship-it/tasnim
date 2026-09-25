"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PRESETS } from "@/lib/cover";
import { faNum } from "@/lib/format";
import { uid } from "@/lib/id";
import { useNewsroom } from "@/lib/store";
import type { Status, Story } from "@/lib/types";
import {
  actorLabel,
  blankStory,
  canEditCategory,
  canEditStory,
  canPublishCategory,
  categoryName,
  currentRole,
  serviceName,
  STATUSES,
  statusLabel,
  transitionsFrom,
} from "@/lib/workflow";
import { CoverThumb } from "../cover-thumb";
import { AssistBar } from "./assist-bar";
import { Button, Field, Flash, Input, Notice, Select, StatusBadge, TextArea } from "../ui";

const forward: Partial<Record<Status, Status>> = {
  draft: "editing",
  editing: "review",
  review: "ready",
  ready: "published",
  published: "archived",
};

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function Editor({ id }: { id: string }) {
  const { data, update, commitStory } = useNewsroom();
  const router = useRouter();
  const isNew = id === "new";
  const existing = data.stories.find((story) => story.id === id);
  const [form, setForm] = useState<Story>(() => existing ?? blankStory(data));
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const role = currentRole(data);
  const editable = canEditStory(data, form.status);
  const transitions = transitionsFrom(data, form.status);
  const others = data.transitions.filter((item) => item.enabled && item.from === form.status && !transitions.some((own) => own.id === item.id));

  useEffect(() => {
    if (isNew) return;
    const key = `tasnim-opened-${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    update((current) => ({
      ...current,
      stories: current.stories.map((story) => (story.id === id ? { ...story, views: story.views + 1 } : story)),
    }));
  }, [id, isNew, update]);

  if (!isNew && !existing) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <h1 className="text-2xl font-bold">این خبر پیدا نشد</h1>
        <Link href="/editorial/cartable" className="text-sm text-rule">
          بازگشت به کارتابل
        </Link>
      </div>
    );
  }

  function patch(partial: Partial<Story>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function addTag() {
    const next = tag.trim();
    if (!next || form.tags.includes(next)) return;
    patch({ tags: [...form.tags, next] });
    setTag("");
  }

  function persist(to?: Status) {
    const title = form.title.trim();
    if (!title) {
      setError("عنوان خبر را بنویسید.");
      return;
    }
    if (!canEditCategory(data, form.categoryId)) {
      setError("نقش شما اجازه ویرایش این دسته را ندارد. از کنترل دسترسی یا دسته دیگری استفاده کنید.");
      return;
    }
    const status = to ?? form.status;
    if (status === "published" && !canPublishCategory(data, form.categoryId)) {
      setError("انتشار این دسته برای نقش شما بسته است.");
      return;
    }
    const storyId = form.id || uid("story");
    const ts = new Date().toISOString();
    const story: Story = {
      ...form,
      id: storyId,
      title,
      status,
      updatedAt: ts,
      createdAt: form.createdAt || ts,
      publishedAt: status === "published" ? form.publishedAt || ts : status === "archived" ? form.publishedAt : undefined,
    };
    const action = to
      ? data.transitions.find((item) => item.from === form.status && item.to === to)?.label ?? statusLabel(data, to)
      : form.status === "draft"
        ? "ذخیره پیش‌نویس"
        : "ذخیره تغییرات";
    commitStory(story, { promote: to === "published", log: `${action}: ${title}` });
    setForm(story);
    setError("");
    setFlash(`${action} انجام شد. وضعیت: ${statusLabel(data, status)}.`);
    if (isNew) router.replace(`/editorial/cartable/${storyId}`);
  }

  const desk = categoryName(data, form.categoryId);

  return (
    <div className="mx-auto w-full max-w-5xl pb-24">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-rule">کارتابل و سردبیری</p>
          <h1 className="text-2xl font-bold">{isNew ? "خبر تازه" : "ویرایش خبر"}</h1>
        </div>
        <Link href="/editorial/cartable" className="text-sm text-rule">
          بازگشت به فهرست
        </Link>
      </div>

      <ol className="mb-4 flex flex-wrap gap-2">
        {STATUSES.filter((status) => status !== "archived").map((status) => {
          const index = STATUSES.indexOf(status);
          const current = STATUSES.indexOf(form.status);
          const active = form.status === status;
          return (
            <li key={status} className={`rounded-full px-2.5 py-1 text-xs ${active ? "bg-ink text-sheet" : current > index ? "bg-sand" : "text-muted"}`}>
              {statusLabel(data, status)}
            </li>
          );
        })}
      </ol>
      {form.status === "archived" ? <Notice>این خبر در آرشیو است.</Notice> : null}

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-4">
          <div>
            <input
              value={form.title}
              disabled={!editable}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="عنوان خبر"
              className="w-full bg-transparent text-3xl font-bold leading-snug outline-none placeholder:text-muted/50"
            />
            <p className="mt-1 text-xs text-muted">{faNum(countWords(form.title))} کلمه</p>
          </div>
          <div>
            <TextArea
              value={form.lead}
              disabled={!editable}
              onChange={(event) => patch({ lead: event.target.value })}
              placeholder="لید"
              className="min-h-24 text-base"
              aria-label="لید"
            />
            <p className="mt-1 text-xs text-muted">{faNum(countWords(form.lead))} کلمه</p>
          </div>
          <TextArea
            value={form.body}
            disabled={!editable}
            onChange={(event) => patch({ body: event.target.value })}
            placeholder="متن خبر"
            className="min-h-80 text-base leading-8"
            aria-label="متن خبر"
          />
          {editable ? <AssistBar title={form.title} lead={form.lead} body={form.body} desk={desk} onApply={patch} /> : null}
        </div>

        <aside className="space-y-4 rounded-lg border border-line bg-sheet p-4">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={form.status} label={statusLabel(data, form.status)} />
            <span className="text-xs text-muted">نقش: {role.name}</span>
          </div>
          <Field label="نویسنده">
            <Input value={form.author} disabled={!editable} onChange={(event) => patch({ author: event.target.value })} list="author-list" />
            <datalist id="author-list">
              {data.users.map((user) => (
                <option key={user.id} value={user.name} />
              ))}
            </datalist>
          </Field>
          <Field label="دسته">
            <Select value={form.categoryId} disabled={!editable} onChange={(event) => patch({ categoryId: event.target.value })}>
              {data.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="سرویس">
            <Select value={form.serviceId} disabled={!editable} onChange={(event) => patch({ serviceId: event.target.value })}>
              {data.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="برچسب‌ها">
            <div className="flex gap-2">
              <Input
                value={tag}
                disabled={!editable}
                onChange={(event) => setTag(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="برچسب و اینتر"
              />
              <Button tone="ghost" disabled={!editable} onClick={addTag}>
                افزودن
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {form.tags.map((item) => (
                <button key={item} type="button" className="rounded-full bg-sand px-2 py-0.5 text-xs" disabled={!editable} onClick={() => patch({ tags: form.tags.filter((tagItem) => tagItem !== item) })}>
                  {item} ×
                </button>
              ))}
            </div>
          </Field>
          <div>
            <p className="text-sm font-medium">تصویر شاخص</p>
            <CoverThumb cover={form.cover} className="mt-2 h-28 w-full rounded-md" />
            <div className="mt-2 flex flex-wrap gap-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={!editable}
                  onClick={() => patch({ cover: preset.id })}
                  className={`rounded-full px-2 py-0.5 text-xs ${form.cover === preset.id ? "bg-ink text-sheet" : "bg-sand"}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <Input className="mt-2" disabled={!editable} value={/^https?:/i.test(form.cover) ? form.cover : ""} placeholder="یا نشانی تصویر" onChange={(event) => patch({ cover: event.target.value || "sand" })} />
          </div>
          {form.imagePrompt ? <p className="text-xs leading-6 text-muted">پرامپت تصویر: {form.imagePrompt}</p> : null}
          {form.audioScript ? (
            <div className="text-xs leading-6 text-muted">
              <p>متن صوت: {form.audioScript}</p>
              <button
                type="button"
                className="mt-1 text-rule"
                onClick={() => {
                  if (!window.speechSynthesis) return;
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(form.audioScript);
                  utterance.lang = "fa-IR";
                  window.speechSynthesis.speak(utterance);
                }}
              >
                پخش متن ذخیره‌شده
              </button>
            </div>
          ) : null}
          <p className="text-xs text-muted">
            {desk} · {serviceName(data, form.serviceId)}
          </p>
          {error ? <p className="text-sm text-rule">{error}</p> : null}
          <Flash>{flash}</Flash>
          {!editable ? <Notice>در این وضعیت با نقش شما فقط خواندن ممکن است. {others.length ? `گام بعدی با ${[...new Set(others.map((item) => actorLabel(data, item.actor)))].join(" یا ")} است.` : ""}</Notice> : null}
          <div className="flex flex-col gap-2">
            {editable ? (
              <Button tone="ghost" onClick={() => persist()}>
                {form.status === "draft" ? "ذخیره پیش‌نویس" : "ذخیره تغییرات"}
              </Button>
            ) : null}
            {transitions.map((transition) => (
              <Button key={transition.id} tone={transition.to === "published" ? "accent" : transition.to === forward[form.status] ? "primary" : "ghost"} onClick={() => persist(transition.to)}>
                {transition.label}
              </Button>
            ))}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 overflow-x-auto border-t border-line bg-sheet p-3 lg:hidden">
        {editable ? (
          <Button tone="ghost" onClick={() => persist()}>
            {form.status === "draft" ? "ذخیره پیش‌نویس" : "ذخیره"}
          </Button>
        ) : null}
        {transitions.map((transition) => (
          <Button key={transition.id} tone={transition.to === "published" ? "accent" : "primary"} onClick={() => persist(transition.to)}>
            {transition.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
