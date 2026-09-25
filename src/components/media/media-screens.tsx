"use client";

import { useState } from "react";
import { PRESETS } from "@/lib/cover";
import { faDate } from "@/lib/format";
import { uid } from "@/lib/id";
import { pushActivity } from "@/lib/activity";
import { useNewsroom } from "@/lib/store";
import type { Album, Feed, Mail, Story } from "@/lib/types";
import { blankStory, placeStory } from "@/lib/workflow";
import { CoverThumb } from "../cover-thumb";
import { Button, Empty, Field, Flash, Input, ModulePage, Notice, Select, TextArea } from "../ui";

export function AlbumsScreen() {
  const { data, update } = useNewsroom();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(data.albums[0]?.id ?? "");
  const [caption, setCaption] = useState("");
  const [src, setSrc] = useState<string>(PRESETS[0].id);
  const [flash, setFlash] = useState("");

  function addAlbum() {
    if (!title.trim()) return;
    const album: Album = { id: uid("alb"), title: title.trim(), description: description.trim(), photos: [] };
    update((current) => ({ ...current, albums: [album, ...current.albums] }));
    setOpen(album.id);
    setTitle("");
    setDescription("");
    setFlash("آلبوم ساخته شد.");
  }

  return (
    <ModulePage slug="albums">
      <Flash>{flash}</Flash>
      <form
        className="grid gap-3 rounded-lg border border-line bg-sheet p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          addAlbum();
        }}
      >
        <Field label="نام آلبوم">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="توضیح">
          <Input value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Button type="submit">ساخت آلبوم</Button>
      </form>
      {data.albums.length === 0 ? <Empty>آلبومی نیست.</Empty> : null}
      {data.albums.map((album) => (
        <article key={album.id} className="rounded-lg border border-line bg-sheet p-4">
          <button type="button" className="text-right" onClick={() => setOpen(open === album.id ? "" : album.id)}>
            <h2 className="font-bold">{album.title}</h2>
            <p className="text-sm text-muted">{album.description}</p>
          </button>
          {open === album.id ? (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {album.photos.map((photo) => (
                  <figure key={photo.id} className="overflow-hidden rounded-md border border-line">
                    <CoverThumb cover={photo.src} className="h-24 w-full" />
                    <figcaption className="px-2 py-1 text-xs">{photo.caption}</figcaption>
                  </figure>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="شرح تصویر" className="max-w-xs" />
                <Select value={PRESETS.some((item) => item.id === src) ? src : "url"} onChange={(event) => setSrc(event.target.value === "url" ? "https://" : event.target.value)}>
                  {PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="url">نشانی تصویر</option>
                </Select>
                {!PRESETS.some((item) => item.id === src) ? <Input value={src} onChange={(event) => setSrc(event.target.value)} placeholder="https://" className="max-w-xs" /> : null}
                <Button
                  onClick={() => {
                    if (!caption.trim()) return;
                    update((current) => ({
                      ...current,
                      albums: current.albums.map((item) =>
                        item.id === album.id ? { ...item, photos: [...item.photos, { id: uid("ph"), caption: caption.trim(), src }] } : item,
                      ),
                    }));
                    setCaption("");
                    setFlash("تصویر به آلبوم اضافه شد.");
                  }}
                >
                  افزودن تصویر
                </Button>
              </div>
            </div>
          ) : null}
        </article>
      ))}
    </ModulePage>
  );
}

export function VideosScreen() {
  const { data, update } = useNewsroom();
  const [form, setForm] = useState({ title: "", url: "", duration: "", summary: "" });
  const [flash, setFlash] = useState("");

  return (
    <ModulePage slug="videos">
      <Notice>این فهرست مشخصات ویدئو را نگه می‌دارد. فایلی روی سرور ذخیره نمی‌شود.</Notice>
      <Flash>{flash}</Flash>
      <form
        className="grid gap-3 rounded-lg border border-line bg-sheet p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.title.trim()) return;
          update((current) => ({
            ...current,
            videos: [{ id: uid("vid"), ...form, title: form.title.trim(), published: false }, ...current.videos],
          }));
          setForm({ title: "", url: "", duration: "", summary: "" });
          setFlash("ویدئو ثبت شد.");
        }}
      >
        <Field label="عنوان">
          <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </Field>
        <Field label="نشانی">
          <Input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://" />
        </Field>
        <Field label="مدت">
          <Input value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} placeholder="۰۲:۰۰" />
        </Field>
        <Field label="خلاصه">
          <Input value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
        </Field>
        <Button type="submit">ثبت ویدئو</Button>
      </form>
      <div className="space-y-2">
        {data.videos.map((video) => (
          <article key={video.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-sheet px-4 py-3">
            <div>
              <h2 className="font-semibold">{video.title}</h2>
              <p className="text-xs text-muted">
                {video.duration} · {video.summary}
              </p>
            </div>
            <Button
              tone={video.published ? "ghost" : "primary"}
              onClick={() =>
                update((current) => ({
                  ...current,
                  videos: current.videos.map((item) => (item.id === video.id ? { ...item, published: !item.published } : item)),
                }))
              }
            >
              {video.published ? "برداشتن از خروجی" : "آماده خروجی"}
            </Button>
          </article>
        ))}
      </div>
    </ModulePage>
  );
}

export function RssScreen() {
  const { data, update } = useNewsroom();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [flash, setFlash] = useState("");
  const [busy, setBusy] = useState("");

  async function refresh(feed: Feed) {
    setBusy(feed.id);
    setFlash("در حال خواندن منبع…");
    try {
      const response = await fetch(feed.url);
      if (!response.ok) throw new Error(String(response.status));
      const xml = await response.text();
      const titles = [...xml.matchAll(/<title>([^<]+)<\/title>/g)].map((match) => match[1].trim()).slice(1, 6);
      if (!titles.length) throw new Error("empty");
      update((current) => ({
        ...current,
        feeds: current.feeds.map((item) =>
          item.id === feed.id
            ? { ...item, items: titles.map((itemTitle) => ({ id: uid("fi"), title: itemTitle, summary: "از تلاش خواندن زنده" })) }
            : item,
        ),
      }));
      setFlash("عنوان‌ها از پاسخ منبع جایگزین نمونه‌ها شد.");
    } catch {
      setFlash("خواندن زنده انجام نشد. بسیاری از خوراک‌ها از داخل مرورگر بسته می‌شوند. نمونه‌های محلی سر جایشان ماندند.");
    } finally {
      setBusy("");
    }
  }

  function toDraft(itemTitle: string, summary: string) {
    const ts = new Date().toISOString();
    const story: Story = { ...blankStory(data), id: uid("story"), title: itemTitle, lead: summary, body: summary, createdAt: ts, updatedAt: ts };
    update((current) => placeStory(current, story, { log: `انتقال از فید: ${itemTitle}` }));
    setFlash("به پیش‌نویس کارتابل رفت.");
  }

  return (
    <ModulePage slug="rss">
      <Notice>نمونه‌ها محلی‌اند. دکمه خواندن، منبع را از مرورگر صدا می‌زند و اگر بسته باشد همان را می‌گوید.</Notice>
      <Flash>{flash}</Flash>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim() || !url.trim()) return;
          update((current) => ({ ...current, feeds: [{ id: uid("feed"), title: title.trim(), url: url.trim(), items: [] }, ...current.feeds] }));
          setTitle("");
          setUrl("");
          setFlash("منبع اضافه شد.");
        }}
      >
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="نام منبع" className="max-w-xs" />
        <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/rss" className="max-w-md" />
        <Button type="submit">افزودن منبع</Button>
      </form>
      {data.feeds.map((feed) => (
        <section key={feed.id} className="rounded-lg border border-line bg-sheet p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold">{feed.title}</h2>
              <p className="text-xs text-muted" dir="ltr">
                {feed.url}
              </p>
            </div>
            <Button tone="ghost" disabled={busy === feed.id} onClick={() => refresh(feed)}>
              خواندن دوباره
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {feed.items.length === 0 ? <li className="text-sm text-muted">موردی ذخیره نشده است.</li> : null}
            {feed.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted">{item.summary}</p>
                </div>
                <Button tone="ghost" onClick={() => toDraft(item.title, item.summary)}>
                  انتقال به کارتابل
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </ModulePage>
  );
}

export function NewsletterScreen() {
  const { data, update } = useNewsroom();
  const [person, setPerson] = useState({ name: "", email: "" });
  const [issue, setIssue] = useState({ subject: "", body: "" });
  const [flash, setFlash] = useState("");

  return (
    <ModulePage slug="newsletter">
      <Notice>شماره در صف محلی می‌ماند و ایمیلی فرستاده نمی‌شود.</Notice>
      <Flash>{flash}</Flash>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!person.name.trim() || !person.email.includes("@")) {
            setFlash("نام و ایمیل معتبر لازم است.");
            return;
          }
          update((current) => ({
            ...current,
            subscribers: [{ id: uid("subr"), name: person.name.trim(), email: person.email.trim(), active: true }, ...current.subscribers],
          }));
          setPerson({ name: "", email: "" });
          setFlash("مخاطب اضافه شد.");
        }}
      >
        <Input value={person.name} onChange={(event) => setPerson({ ...person, name: event.target.value })} placeholder="نام" />
        <Input value={person.email} onChange={(event) => setPerson({ ...person, email: event.target.value })} placeholder="ایمیل" dir="ltr" />
        <Button type="submit">افزودن مخاطب</Button>
      </form>
      <ul className="divide-y divide-line rounded-lg border border-line bg-sheet">
        {data.subscribers.map((subscriber) => (
          <li key={subscriber.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
            <span>
              {subscriber.name} · <span dir="ltr">{subscriber.email}</span>
            </span>
            <Button
              tone="quiet"
              onClick={() =>
                update((current) => ({
                  ...current,
                  subscribers: current.subscribers.map((item) => (item.id === subscriber.id ? { ...item, active: !item.active } : item)),
                }))
              }
            >
              {subscriber.active ? "فعال" : "متوقف"}
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="space-y-3 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!issue.subject.trim()) return;
          update((current) => ({
            ...current,
            issues: [{ id: uid("iss"), subject: issue.subject.trim(), body: issue.body.trim(), status: "draft", createdAt: new Date().toISOString() }, ...current.issues],
          }));
          setIssue({ subject: "", body: "" });
          setFlash("پیش‌نویس خبرنامه ذخیره شد.");
        }}
      >
        <h2 className="font-bold">شماره تازه</h2>
        <Field label="موضوع">
          <Input value={issue.subject} onChange={(event) => setIssue({ ...issue, subject: event.target.value })} />
        </Field>
        <Field label="متن">
          <TextArea value={issue.body} onChange={(event) => setIssue({ ...issue, body: event.target.value })} />
        </Field>
        <Button type="submit">ذخیره پیش‌نویس</Button>
      </form>
      {data.issues.map((item) => (
        <article key={item.id} className="rounded-lg border border-line bg-sheet p-4">
          <p className="text-xs text-muted">
            {item.status === "queued" ? "در صف محلی" : "پیش‌نویس"} · {faDate(item.createdAt)}
          </p>
          <h2 className="font-bold">{item.subject}</h2>
          <p className="text-sm text-muted">{item.body}</p>
          {item.status === "draft" ? (
            <Button
              className="mt-3"
              onClick={() => {
                update((current) => ({
                  ...current,
                  issues: current.issues.map((issueItem) => (issueItem.id === item.id ? { ...issueItem, status: "queued" } : issueItem)),
                }));
                setFlash("در صف محلی ثبت شد. ایمیلی ارسال نشده است.");
              }}
            >
              گذاشتن در صف محلی
            </Button>
          ) : null}
        </article>
      ))}
    </ModulePage>
  );
}

export function SocialScreen() {
  const { data, update } = useNewsroom();
  const [form, setForm] = useState({ channel: "تلگرام", text: "", storyId: data.stories.find((story) => story.status === "published")?.id ?? "" });
  const [flash, setFlash] = useState("");
  const channels = ["تلگرام", "بله", "اینستاگرام", "ایکس"];

  return (
    <ModulePage slug="social">
      <Notice>پیش‌نویس در مرورگر می‌ماند و به شبکه‌ای فرستاده نمی‌شود.</Notice>
      <Flash>{flash}</Flash>
      <form
        className="space-y-3 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.text.trim()) return;
          update((current) => ({
            ...current,
            social: [{ id: uid("soc"), channel: form.channel, text: form.text.trim(), storyId: form.storyId, status: "draft", createdAt: new Date().toISOString() }, ...current.social],
          }));
          setFlash("پیش‌نویس شبکه ذخیره شد.");
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="شبکه">
            <Select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>
              {channels.map((channel) => (
                <option key={channel}>{channel}</option>
              ))}
            </Select>
          </Field>
          <Field label="خبر مبدأ">
            <Select
              value={form.storyId}
              onChange={(event) => {
                const storyId = event.target.value;
                const story = data.stories.find((item) => item.id === storyId);
                setForm({ ...form, storyId, text: story ? `${story.title}\n${story.lead}` : form.text });
              }}
            >
              <option value="">بدون خبر</option>
              {data.stories.map((story) => (
                <option key={story.id} value={story.id}>
                  {story.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="متن">
          <TextArea value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} />
        </Field>
        <Button type="submit">ذخیره پیش‌نویس</Button>
      </form>
      {data.social.map((post) => (
        <article key={post.id} className="rounded-lg border border-line bg-sheet p-4">
          <p className="text-xs text-muted">
            {post.channel} · {post.status === "ready" ? "آماده در صف محلی" : "پیش‌نویس"}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{post.text}</p>
          {post.status === "draft" ? (
            <Button
              className="mt-3"
              tone="ghost"
              onClick={() =>
                update((current) => ({
                  ...current,
                  social: current.social.map((item) => (item.id === post.id ? { ...item, status: "ready" } : item)),
                }))
              }
            >
              علامت آماده
            </Button>
          ) : null}
        </article>
      ))}
    </ModulePage>
  );
}

export function EmailScreen() {
  const { data, update } = useNewsroom();
  const [folder, setFolder] = useState<Mail["folder"]>("inbox");
  const [open, setOpen] = useState(data.mail[0]?.id ?? "");
  const [form, setForm] = useState({ to: "", subject: "", body: "" });
  const [flash, setFlash] = useState("");
  const items = data.mail.filter((mail) => mail.folder === folder);

  return (
    <ModulePage slug="email">
      <Notice>صندوق محلی است. نامه‌ای از سرور پست رد و بدل نمی‌شود.</Notice>
      <Flash>{flash}</Flash>
      <div className="flex gap-2">
        {(["inbox", "drafts", "outbox"] as const).map((item) => (
          <Button key={item} tone={folder === item ? "primary" : "ghost"} onClick={() => setFolder(item)}>
            {item === "inbox" ? "صندوق" : item === "drafts" ? "پیش‌نویس" : "ارسالی محلی"}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <ul className="rounded-lg border border-line bg-sheet">
          {items.length === 0 ? <li className="p-4 text-sm text-muted">نامه‌ای در این پوشه نیست.</li> : null}
          {items.map((mail) => (
            <li key={mail.id}>
              <button type="button" className={`block w-full px-3 py-2 text-right text-sm ${open === mail.id ? "bg-sand" : ""}`} onClick={() => {
                setOpen(mail.id);
                update((current) => ({ ...current, mail: current.mail.map((item) => (item.id === mail.id ? { ...item, read: true } : item)) }));
              }}>
                <span className={mail.read ? "text-muted" : "font-semibold"}>{mail.subject}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-line bg-sheet p-4">
          {data.mail.find((mail) => mail.id === open && mail.folder === folder) ? (
            <article>
              {(() => {
                const mail = data.mail.find((item) => item.id === open)!;
                return (
                  <>
                    <h2 className="font-bold">{mail.subject}</h2>
                    <p className="text-xs text-muted">
                      از {mail.from} به {mail.to} · {faDate(mail.createdAt)}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{mail.body}</p>
                  </>
                );
              })()}
            </article>
          ) : (
            <p className="text-sm text-muted">نامه‌ای را انتخاب کنید.</p>
          )}
        </div>
      </div>
      <form
        className="space-y-3 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.subject.trim()) return;
          update((current) =>
            pushActivity(
              {
                ...current,
                mail: [
                  {
                    id: uid("mail"),
                    folder: "outbox",
                    from: "desk@newsroom.local",
                    to: form.to.trim() || "desk@newsroom.local",
                    subject: form.subject.trim(),
                    body: form.body.trim(),
                    read: true,
                    createdAt: new Date().toISOString(),
                  },
                  ...current.mail,
                ],
              },
              `نامه محلی: ${form.subject.trim()}`,
            ),
          );
          setForm({ to: "", subject: "", body: "" });
          setFolder("outbox");
          setFlash("در صندوق ارسالی محلی ثبت شد.");
        }}
      >
        <h2 className="font-bold">نامه تازه</h2>
        <Field label="گیرنده">
          <Input value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} dir="ltr" />
        </Field>
        <Field label="موضوع">
          <Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
        </Field>
        <Field label="متن">
          <TextArea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
        </Field>
        <Button type="submit">ثبت در ارسالی محلی</Button>
      </form>
    </ModulePage>
  );
}

export function PeopleScreen() {
  const { data, update } = useNewsroom();
  const [form, setForm] = useState({ name: "", title: "", bio: "", kind: "خبرنگار" });
  const [flash, setFlash] = useState("");

  return (
    <ModulePage slug="people">
      <Flash>{flash}</Flash>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.people.filter((person) => person.visible).map((person) => (
          <article key={person.id} className="rounded-lg border border-line bg-sheet p-4">
            <p className="text-xs text-rule">{person.kind}</p>
            <h2 className="text-lg font-bold">{person.name}</h2>
            <p className="text-sm">{person.title}</p>
            <p className="mt-2 text-sm leading-7 text-muted">{person.bio}</p>
            <Button
              tone="quiet"
              className="mt-2"
              onClick={() =>
                update((current) => ({
                  ...current,
                  people: current.people.map((item) => (item.id === person.id ? { ...item, visible: false } : item)),
                }))
              }
            >
              برداشتن از صفحه معرفی
            </Button>
          </article>
        ))}
      </div>
      {data.people.some((person) => !person.visible) ? (
        <div className="text-sm text-muted">
          پنهان:{" "}
          {data.people
            .filter((person) => !person.visible)
            .map((person) => (
              <button
                key={person.id}
                type="button"
                className="ml-2 underline"
                onClick={() =>
                  update((current) => ({
                    ...current,
                    people: current.people.map((item) => (item.id === person.id ? { ...item, visible: true } : item)),
                  }))
                }
              >
                {person.name}
              </button>
            ))}
        </div>
      ) : null}
      <form
        className="grid gap-3 rounded-lg border border-line bg-sheet p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.name.trim()) return;
          update((current) => ({
            ...current,
            people: [...current.people, { id: uid("p"), ...form, name: form.name.trim(), visible: true }],
          }));
          setForm({ name: "", title: "", bio: "", kind: "خبرنگار" });
          setFlash("فرد به صفحه معرفی اضافه شد.");
        }}
      >
        <Field label="نام">
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="سمت">
          <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </Field>
        <Field label="گروه">
          <Select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}>
            {["مدیر مسئول", "سردبیر", "خبرنگار", "عکاس"].map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </Select>
        </Field>
        <Field label="معرفی کوتاه">
          <Input value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
        </Field>
        <Button type="submit">افزودن به صفحه معرفی</Button>
      </form>
    </ModulePage>
  );
}
