"use client";

import { useState } from "react";
import { suggestDraft } from "@/lib/assist";
import { faDate, faNum } from "@/lib/format";
import { uid } from "@/lib/id";
import { useNewsroom } from "@/lib/store";
import type { Story } from "@/lib/types";
import {
  ACTORS,
  actorLabel,
  blankStory,
  canPerm,
  categoryName,
  currentRole,
  currentUser,
  placeStory,
  serviceName,
  STATUSES,
  statusLabel,
} from "@/lib/workflow";
import { AssistBar } from "./assist-bar";
import { Button, Empty, Field, Flash, Input, ModulePage, Notice, Select, TextArea } from "../ui";

export function AiScreen() {
  const { data, commitStory } = useNewsroom();
  const [storyId, setStoryId] = useState("new");
  const [form, setForm] = useState<Story>(() => blankStory(data));
  const [topic, setTopic] = useState("");
  const [armed, setArmed] = useState(false);
  const [flash, setFlash] = useState("");
  const desk = categoryName(data, form.categoryId);

  function load(id: string) {
    setStoryId(id);
    setArmed(false);
    if (id === "new") setForm(blankStory(data));
    else {
      const story = data.stories.find((item) => item.id === id);
      if (story) setForm(story);
    }
  }

  function dropDraft() {
    if (!topic.trim()) {
      setFlash("موضوع را بنویسید.");
      return;
    }
    if ((form.title || form.body) && !armed) {
      setArmed(true);
      setFlash("فرم پر است. یک بار دیگر بزنید تا پیش‌نویس محلی جایگزین شود.");
      return;
    }
    const draft = suggestDraft(topic.trim(), desk);
    setForm((current) => ({ ...current, ...draft }));
    setArmed(false);
    setFlash("پیش‌نویس محلی در فرم نشست. قبل از ذخیره آن را ویرایش کنید.");
  }

  function save() {
    if (!form.title.trim()) {
      setFlash("عنوان خالی است.");
      return;
    }
    const ts = new Date().toISOString();
    const story: Story = {
      ...form,
      id: storyId === "new" ? uid("story") : form.id || uid("story"),
      title: form.title.trim(),
      status: form.status || "draft",
      updatedAt: ts,
      createdAt: form.createdAt || ts,
    };
    commitStory(story, { log: `ذخیره از دستیار: ${story.title}` });
    setStoryId(story.id);
    setForm(story);
    setFlash("در کارتابل ذخیره شد.");
  }

  return (
    <ModulePage slug="ai">
      <Notice>دستیار محلی است. هیچ سرویسی بیرون از مرورگر خبر نمی‌سازد و متن را جایگزین قضاوت تحریریه نمی‌کند.</Notice>
      <Flash>{flash}</Flash>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_16rem]">
        <Field label="خبر موجود یا پیش‌نویس تازه">
          <Select value={storyId} onChange={(event) => load(event.target.value)}>
            <option value="new">پیش‌نویس تازه</option>
            {data.stories.map((story) => (
              <option key={story.id} value={story.id}>
                {story.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="دسته اسکلت خبر">
          <Select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input value={topic} onChange={(event) => { setTopic(event.target.value); setArmed(false); }} placeholder="موضوع خبر، مثلاً افتتاح درمانگاه محلی" className="max-w-xl" />
        <Button tone="ghost" onClick={dropDraft}>
          نشاندن پیش‌نویس محلی
        </Button>
      </div>
      <Field label="عنوان">
        <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      </Field>
      <Field label="لید / خلاصه">
        <TextArea value={form.lead} onChange={(event) => setForm({ ...form, lead: event.target.value })} />
      </Field>
      <Field label="متن">
        <TextArea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} className="min-h-48" />
      </Field>
      <AssistBar title={form.title} lead={form.lead} body={form.body} desk={desk} onApply={(patch) => setForm((current) => ({ ...current, ...patch }))} />
      <Button onClick={save}>ذخیره در کارتابل</Button>
    </ModulePage>
  );
}

export function ProcessScreen() {
  const { data, update } = useNewsroom();
  const allowed = canPerm(data, "review") || canPerm(data, "publish");
  const [flash, setFlash] = useState("");

  return (
    <ModulePage slug="process">
      <Notice>با عوض کردن نقش هر گذار، دکمه‌های کارتابل همان لحظه برای همان نقش عوض می‌شود. نام گام‌ها روی نشان وضعیت می‌نشیند.</Notice>
      {!allowed ? <Notice>تغییر فرایند با سردبیر یا مدیر مسئول است. حالا فقط می‌بینید.</Notice> : null}
      <Flash>{flash}</Flash>
      <ol className="space-y-2">
        {data.steps.map((step, index) => (
          <li key={step.status} className="rounded-lg border border-line bg-sheet p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">{faNum(index + 1)}</span>
              <Input
                disabled={!allowed}
                value={step.label}
                aria-label={`نام ${step.status}`}
                onChange={(event) => {
                  const label = event.target.value;
                  update((current) => ({
                    ...current,
                    steps: current.steps.map((item) => (item.status === step.status ? { ...item, label } : item)),
                  }));
                }}
                className="max-w-xs font-semibold"
              />
            </div>
            <TextArea
              disabled={!allowed}
              className="mt-2 min-h-16"
              value={step.note}
              aria-label={`یادداشت ${step.label}`}
              onChange={(event) => {
                const note = event.target.value;
                update((current) => ({
                  ...current,
                  steps: current.steps.map((item) => (item.status === step.status ? { ...item, note } : item)),
                }));
                setFlash("یادداشت گام ذخیره شد.");
              }}
            />
          </li>
        ))}
      </ol>
      <div className="overflow-x-auto rounded-lg border border-line bg-sheet">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b border-line text-right text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">از</th>
              <th className="px-3 py-2 font-medium">به</th>
              <th className="px-3 py-2 font-medium">برچسب دکمه</th>
              <th className="px-3 py-2 font-medium">نقش</th>
              <th className="px-3 py-2 font-medium">فعال</th>
            </tr>
          </thead>
          <tbody>
            {data.transitions.map((transition) => (
              <tr key={transition.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2">{statusLabel(data, transition.from)}</td>
                <td className="px-3 py-2">{statusLabel(data, transition.to)}</td>
                <td className="px-3 py-2">
                  <Input
                    disabled={!allowed}
                    value={transition.label}
                    aria-label="برچسب گذار"
                    onChange={(event) => {
                      const label = event.target.value;
                      update((current) => ({
                        ...current,
                        transitions: current.transitions.map((item) => (item.id === transition.id ? { ...item, label } : item)),
                      }));
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <Select
                    disabled={!allowed}
                    value={transition.actor}
                    aria-label="نقش گذار"
                    onChange={(event) => {
                      const actor = event.target.value as typeof transition.actor;
                      update((current) => ({
                        ...current,
                        transitions: current.transitions.map((item) => (item.id === transition.id ? { ...item, actor } : item)),
                      }));
                      setFlash("نقش این گذار عوض شد.");
                    }}
                  >
                    {ACTORS.map((actor) => (
                      <option key={actor.id} value={actor.id}>
                        {actorLabel(data, actor.id)}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    disabled={!allowed}
                    checked={transition.enabled}
                    aria-label="فعال بودن گذار"
                    onChange={(event) => {
                      const enabled = event.target.checked;
                      update((current) => ({
                        ...current,
                        transitions: current.transitions.map((item) => (item.id === transition.id ? { ...item, enabled } : item)),
                      }));
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">گام‌های ثابت گردش: {STATUSES.map((status) => statusLabel(data, status)).join(" ← ")}</p>
    </ModulePage>
  );
}

export function SubmissionsScreen() {
  const { data, update } = useNewsroom();
  const role = currentRole(data);
  const user = currentUser(data);
  const canAccept = canPerm(data, "review");
  const [form, setForm] = useState({ title: "", lead: "", body: "", categoryId: data.categories[0]?.id ?? "" });
  const [flash, setFlash] = useState("");

  function send() {
    if (!form.title.trim()) {
      setFlash("عنوان ارسال را بنویسید.");
      return;
    }
    update((current) => ({
      ...current,
      submissions: [
        {
          id: uid("sub"),
          title: form.title.trim(),
          lead: form.lead.trim(),
          body: form.body.trim(),
          categoryId: form.categoryId,
          author: user?.name ?? role.name,
          status: "new",
          note: "",
          createdAt: new Date().toISOString(),
        },
        ...current.submissions,
      ],
    }));
    setForm({ title: "", lead: "", body: "", categoryId: form.categoryId });
    setFlash("خبر به صندوق ارسال رفت.");
  }

  function accept(id: string) {
    const submission = data.submissions.find((item) => item.id === id);
    if (!submission) return;
    const ts = new Date().toISOString();
    const story: Story = {
      ...blankStory(data),
      id: uid("story"),
      title: submission.title,
      lead: submission.lead,
      body: submission.body,
      categoryId: submission.categoryId,
      author: submission.author,
      createdAt: ts,
      updatedAt: ts,
    };
    update((current) =>
      placeStory(
        {
          ...current,
          submissions: current.submissions.map((item) => (item.id === id ? { ...item, status: "accepted" } : item)),
        },
        story,
        { log: `پذیرش ارسال: ${story.title}` },
      ),
    );
    setFlash("به پیش‌نویس کارتابل اضافه شد.");
  }

  return (
    <ModulePage slug="submissions">
      <Flash>{flash}</Flash>
      <form
        className="space-y-3 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <h2 className="font-bold">ارسال خبر</h2>
        <Field label="عنوان">
          <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </Field>
        <Field label="لید">
          <TextArea value={form.lead} onChange={(event) => setForm({ ...form, lead: event.target.value })} />
        </Field>
        <Field label="متن">
          <TextArea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
        </Field>
        <Field label="دسته">
          <Select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit">ثبت ارسال</Button>
      </form>
      <div className="space-y-3">
        {data.submissions.length === 0 ? <Empty>ارسالی در صندوق نیست.</Empty> : null}
        {data.submissions.map((submission) => (
          <article key={submission.id} className="rounded-lg border border-line bg-sheet p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>{submission.status === "new" ? "جدید" : submission.status === "accepted" ? "پذیرفته" : "ردشده"}</span>
              <span>
                {submission.author} · {faDate(submission.createdAt)}
              </span>
            </div>
            <h2 className="mt-1 font-bold">{submission.title}</h2>
            <p className="text-sm text-muted">{submission.lead}</p>
            <p className="text-xs text-muted">{categoryName(data, submission.categoryId)}</p>
            {submission.note ? <p className="mt-1 text-sm">یادداشت: {submission.note}</p> : null}
            {submission.status === "new" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button disabled={!canAccept} onClick={() => accept(submission.id)}>
                  پذیرش در کارتابل
                </Button>
                <Button
                  tone="ghost"
                  disabled={!canAccept}
                  onClick={() => {
                    update((current) => ({
                      ...current,
                      submissions: current.submissions.map((item) => (item.id === submission.id ? { ...item, status: "rejected", note: "برگردانده شد." } : item)),
                    }));
                    setFlash("ارسال رد شد.");
                  }}
                >
                  رد
                </Button>
              </div>
            ) : null}
            {submission.status === "new" && !canAccept ? <p className="mt-2 text-xs text-muted">پذیرش و رد با سردبیر است.</p> : null}
          </article>
        ))}
      </div>
    </ModulePage>
  );
}

export function OrderScreen() {
  const { data, update } = useNewsroom();
  const allowed = canPerm(data, "review") || canPerm(data, "publish");
  const order = data.homeOrder.filter((id) => data.stories.some((story) => story.id === id && story.status === "published"));

  function move(id: string, dir: -1 | 1) {
    update((current) => {
      const list = current.homeOrder.filter((item) => current.stories.some((story) => story.id === item && story.status === "published"));
      const index = list.indexOf(id);
      const target = index + dir;
      if (index < 0 || target < 0 || target >= list.length) return current;
      const next = list.slice();
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return { ...current, homeOrder: next };
    });
  }

  return (
    <ModulePage slug="order">
      {!allowed ? <Notice>جابه‌جایی تیترها با سردبیر یا مدیر مسئول است.</Notice> : null}
      {order.length === 0 ? <Empty>خبر منتشرشده‌ای برای چیدن نیست.</Empty> : null}
      <ol className="space-y-2">
        {order.map((id, index) => {
          const story = data.stories.find((item) => item.id === id);
          if (!story) return null;
          return (
            <li key={id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-sheet px-4 py-3">
              <div>
                <p className="text-xs text-rule">{index === 0 ? "تیتر یک" : `ردیف ${faNum(index + 1)}`}</p>
                <p className="font-semibold">{story.title}</p>
                <p className="text-xs text-muted">
                  {story.author} · {categoryName(data, story.categoryId)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button tone="ghost" disabled={!allowed || index === 0} onClick={() => move(id, -1)}>
                  بالاتر
                </Button>
                <Button tone="ghost" disabled={!allowed || index === order.length - 1} onClick={() => move(id, 1)}>
                  پایین‌تر
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </ModulePage>
  );
}

export function SuggestionsScreen() {
  const { data, update } = useNewsroom();
  const published = data.stories.filter((story) => story.status === "published");
  const canDecide = canPerm(data, "review") || canPerm(data, "publish");
  const [storyId, setStoryId] = useState(published[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(data.services[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState("");

  function propose() {
    if (!storyId || !serviceId) {
      setFlash("خبر و سرویس را انتخاب کنید.");
      return;
    }
    update((current) => ({
      ...current,
      suggestions: [
        { id: uid("sug"), storyId, serviceId, note: note.trim(), status: "pending", createdAt: new Date().toISOString() },
        ...current.suggestions,
      ],
    }));
    setNote("");
    setFlash("پیشنهاد ثبت شد.");
  }

  function decide(id: string, status: "accepted" | "rejected") {
    update((current) => {
      const suggestion = current.suggestions.find((item) => item.id === id);
      const suggestions = current.suggestions.map((item) => (item.id === id ? { ...item, status } : item));
      if (status === "accepted" && suggestion) {
        return {
          ...current,
          suggestions,
          stories: current.stories.map((story) => (story.id === suggestion.storyId ? { ...story, serviceId: suggestion.serviceId, updatedAt: new Date().toISOString() } : story)),
        };
      }
      return { ...current, suggestions };
    });
    setFlash(status === "accepted" ? "سرویس خبر عوض شد." : "پیشنهاد رد شد.");
  }

  return (
    <ModulePage slug="suggestions">
      <Flash>{flash}</Flash>
      <form
        className="grid gap-3 rounded-lg border border-line bg-sheet p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          propose();
        }}
      >
        <Field label="خبر منتشرشده">
          <Select value={storyId} onChange={(event) => setStoryId(event.target.value)}>
            {published.map((story) => (
              <option key={story.id} value={story.id}>
                {story.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="سرویس مقصد">
          <Select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            {data.services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Field label="یادداشت">
            <Input value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
        </div>
        <Button type="submit">ثبت پیشنهاد</Button>
      </form>
      <div className="space-y-3">
        {data.suggestions.length === 0 ? <Empty>پیشنهادی ثبت نشده است.</Empty> : null}
        {data.suggestions.map((suggestion) => {
          const story = data.stories.find((item) => item.id === suggestion.storyId);
          return (
            <article key={suggestion.id} className="rounded-lg border border-line bg-sheet p-4">
              <p className="text-xs text-muted">
                {suggestion.status === "pending" ? "در انتظار" : suggestion.status === "accepted" ? "پذیرفته" : "ردشده"} · {faDate(suggestion.createdAt)}
              </p>
              <h2 className="font-bold">{story?.title ?? "خبر حذف‌شده"}</h2>
              <p className="text-sm">به سرویس {serviceName(data, suggestion.serviceId)}</p>
              {suggestion.note ? <p className="text-sm text-muted">{suggestion.note}</p> : null}
              {suggestion.status === "pending" ? (
                <div className="mt-3 flex gap-2">
                  <Button disabled={!canDecide} onClick={() => decide(suggestion.id, "accepted")}>
                    پذیرش
                  </Button>
                  <Button tone="ghost" disabled={!canDecide} onClick={() => decide(suggestion.id, "rejected")}>
                    رد
                  </Button>
                </div>
              ) : null}
              {suggestion.status === "pending" && !canDecide ? <p className="mt-2 text-xs text-muted">تصمیم با سردبیر یا مدیر مسئول است.</p> : null}
            </article>
          );
        })}
      </div>
    </ModulePage>
  );
}
