"use client";

import { useState } from "react";
import { faDate, faNum } from "@/lib/format";
import { uid } from "@/lib/id";
import { useNewsroom } from "@/lib/store";
import { canPerm } from "@/lib/workflow";
import { Button, Empty, Field, Flash, Input, ModulePage, Notice, TextArea } from "../ui";

export function CommentsScreen() {
  const { data, update } = useNewsroom();
  const allowed = canPerm(data, "review") || canPerm(data, "publish");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [flash, setFlash] = useState("");
  const items = data.comments.filter((comment) => filter === "all" || comment.status === filter);

  function setStatus(id: string, status: "approved" | "rejected") {
    update((current) => ({
      ...current,
      comments: current.comments.map((comment) => (comment.id === id ? { ...comment, status } : comment)),
    }));
    setFlash(status === "approved" ? "نظر تأیید شد." : "نظر رد شد.");
  }

  return (
    <ModulePage slug="comments">
      {!allowed ? <Notice>تأیید و رد با سردبیر یا مدیر مسئول است. فهرست برای خبرنگار باز است.</Notice> : null}
      <Flash>{flash}</Flash>
      <div className="flex flex-wrap gap-2">
        {([
          ["pending", "در انتظار"],
          ["approved", "تأییدشده"],
          ["rejected", "ردشده"],
          ["all", "همه"],
        ] as const).map(([key, label]) => (
          <Button key={key} tone={filter === key ? "primary" : "ghost"} onClick={() => setFilter(key)}>
            {label}
          </Button>
        ))}
      </div>
      {items.length === 0 ? <Empty>نظری در این وضعیت نیست.</Empty> : null}
      {items.map((comment) => {
        const story = data.stories.find((item) => item.id === comment.storyId);
        return (
          <article key={comment.id} className="rounded-lg border border-line bg-sheet p-4">
            <p className="text-xs text-muted">
              {comment.author} · {faDate(comment.createdAt)} · {story?.title ?? "خبر نامشخص"}
            </p>
            <p className="mt-1 text-sm leading-7">{comment.body}</p>
            {comment.status === "pending" ? (
              <div className="mt-3 flex gap-2">
                <Button disabled={!allowed} onClick={() => setStatus(comment.id, "approved")}>
                  تأیید
                </Button>
                <Button tone="ghost" disabled={!allowed} onClick={() => setStatus(comment.id, "rejected")}>
                  رد
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">{comment.status === "approved" ? "تأیید شده" : "رد شده"}</p>
            )}
          </article>
        );
      })}
    </ModulePage>
  );
}

export function PollsScreen() {
  const { data, update } = useNewsroom();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState("گزینه اول\nگزینه دوم");
  const [flash, setFlash] = useState("");
  return (
    <ModulePage slug="polls">
      <Notice>رأی‌ها شمارش محلی همین پنل‌اند، نه صندوق سایت عمومی.</Notice>
      <Flash>{flash}</Flash>
      {data.polls.map((poll) => {
        const total = poll.options.reduce((sum, option) => sum + option.votes, 0);
        return (
          <article key={poll.id} className="rounded-lg border border-line bg-sheet p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold">{poll.question}</h2>
              <Button tone="ghost" onClick={() => update((current) => ({ ...current, polls: current.polls.map((item) => (item.id === poll.id ? { ...item, closed: !item.closed } : item)) }))}>
                {poll.closed ? "بازگشایی" : "بستن"}
              </Button>
            </div>
            <ul className="mt-3 space-y-2">
              {poll.options.map((option) => (
                <li key={option.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {option.label} · {faNum(option.votes)}
                    {total ? ` (${faNum(Math.round((option.votes / total) * 100))}٪)` : ""}
                  </span>
                  <Button
                    tone="ghost"
                    disabled={poll.closed}
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        polls: current.polls.map((item) =>
                          item.id === poll.id
                            ? { ...item, options: item.options.map((choice) => (choice.id === option.id ? { ...choice, votes: choice.votes + 1 } : choice)) }
                            : item,
                        ),
                      }))
                    }
                  >
                    یک رأی
                  </Button>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
      <form
        className="space-y-3 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const labels = options.split("\n").map((line) => line.trim()).filter(Boolean);
          if (!question.trim() || labels.length < 2) {
            setFlash("پرسش و دست‌کم دو گزینه لازم است.");
            return;
          }
          update((current) => ({
            ...current,
            polls: [{ id: uid("poll"), question: question.trim(), closed: false, options: labels.map((label) => ({ id: uid("op"), label, votes: 0 })) }, ...current.polls],
          }));
          setQuestion("");
          setFlash("نظرسنجی ساخته شد.");
        }}
      >
        <Field label="پرسش">
          <Input value={question} onChange={(event) => setQuestion(event.target.value)} />
        </Field>
        <Field label="گزینه‌ها، هر خط یکی">
          <TextArea value={options} onChange={(event) => setOptions(event.target.value)} />
        </Field>
        <Button type="submit">ساخت نظرسنجی</Button>
      </form>
    </ModulePage>
  );
}

export function ContactScreen() {
  const { data, update } = useNewsroom();
  const labels = { new: "جدید", seen: "دیده‌شده", closed: "بسته" } as const;
  return (
    <ModulePage slug="contact">
      {data.contacts.length === 0 ? <Empty>پیامی نرسیده است.</Empty> : null}
      {data.contacts.map((message) => (
        <article key={message.id} className="rounded-lg border border-line bg-sheet p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">{message.name}</h2>
            <span className="text-xs text-muted">{labels[message.status]} · {faDate(message.createdAt)}</span>
          </div>
          <p className="text-xs text-muted" dir="ltr">{message.email}</p>
          <p className="mt-2 text-sm leading-7">{message.body}</p>
          <div className="mt-3 flex gap-2">
            {(["seen", "closed"] as const).map((status) => (
              <Button
                key={status}
                tone="ghost"
                onClick={() => update((current) => ({ ...current, contacts: current.contacts.map((item) => (item.id === message.id ? { ...item, status } : item)) }))}
              >
                {labels[status]}
              </Button>
            ))}
          </div>
        </article>
      ))}
    </ModulePage>
  );
}

export function ForumScreen() {
  const { data, update } = useNewsroom();
  const me = data.users.find((user) => user.roleId === data.currentRoleId)?.name ?? "تحریریه";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(data.threads[0]?.id ?? "");
  const [reply, setReply] = useState("");
  const [flash, setFlash] = useState("");
  const thread = data.threads.find((item) => item.id === open);

  return (
    <ModulePage slug="forum">
      <Flash>{flash}</Flash>
      <form
        className="space-y-3 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim() || !body.trim()) return;
          const id = uid("th");
          update((current) => ({
            ...current,
            threads: [{ id, title: title.trim(), posts: [{ id: uid("fp"), author: me, body: body.trim(), createdAt: new Date().toISOString() }] }, ...current.threads],
          }));
          setOpen(id);
          setTitle("");
          setBody("");
          setFlash("رشته تازه باز شد.");
        }}
      >
        <Field label="موضوع">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="نخستین پیام">
          <TextArea value={body} onChange={(event) => setBody(event.target.value)} />
        </Field>
        <Button type="submit">شروع گفتگو</Button>
      </form>
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <ul className="rounded-lg border border-line bg-sheet">
          {data.threads.map((item) => (
            <li key={item.id}>
              <button type="button" className={`block w-full px-3 py-2 text-right text-sm ${open === item.id ? "bg-sand font-semibold" : ""}`} onClick={() => setOpen(item.id)}>
                {item.title}
              </button>
            </li>
          ))}
        </ul>
        <div className="space-y-3">
          {thread ? (
            <>
              <h2 className="text-lg font-bold">{thread.title}</h2>
              {thread.posts.map((post) => (
                <article key={post.id} className="rounded-lg border border-line bg-sheet p-3">
                  <p className="text-xs text-muted">
                    {post.author} · {faDate(post.createdAt)}
                  </p>
                  <p className="text-sm leading-7">{post.body}</p>
                </article>
              ))}
              <form
                className="flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!reply.trim()) return;
                  update((current) => ({
                    ...current,
                    threads: current.threads.map((item) =>
                      item.id === thread.id
                        ? { ...item, posts: [...item.posts, { id: uid("fp"), author: me, body: reply.trim(), createdAt: new Date().toISOString() }] }
                        : item,
                    ),
                  }));
                  setReply("");
                  setFlash("پاسخ ثبت شد.");
                }}
              >
                <TextArea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="پاسخ" />
                <Button type="submit">ثبت پاسخ</Button>
              </form>
            </>
          ) : (
            <Empty>رشته‌ای انتخاب نشده است.</Empty>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
