"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { uid } from "@/lib/id";
import { useNewsroom } from "@/lib/store";
import type { ChatMessage, ChatThread } from "@/lib/types";
import { currentUser } from "@/lib/workflow";
import { faDate } from "@/lib/format";
import { Button, Empty, Field, Flash, Input, ModulePage, cn } from "../ui";

function unreadForThread(messages: ChatMessage[], threadId: string, userId: string, cursors: { userId: string; threadId: string; lastReadAt: string }[]) {
  const cursor = cursors.find((item) => item.userId === userId && item.threadId === threadId)?.lastReadAt ?? "";
  return messages.filter((m) => m.threadId === threadId && m.senderUserId !== userId && m.createdAt > cursor).length;
}

export function ChatScreen() {
  const { data, update } = useNewsroom();
  const me = currentUser(data);
  const searchParams = useSearchParams();
  const threadFromUrl = searchParams.get("thread");
  const [tab, setTab] = useState<"direct" | "group">("direct");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(data.chatThreads[0]?.id ?? "");
  const [text, setText] = useState("");
  const [flash, setFlash] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<{ name: string; dataUrl: string } | null>(null);

  const threads = useMemo(
    () =>
      data.chatThreads
        .filter((thread) => thread.kind === tab)
        .filter((thread) => {
          if (!query.trim()) return true;
          return thread.title.includes(query.trim());
        })
        .sort((a, b) => b.lastAt.localeCompare(a.lastAt)),
    [data.chatThreads, tab, query],
  );

  const active = data.chatThreads.find((thread) => thread.id === activeId) ?? threads[0];
  const messages = useMemo(
    () =>
      data.chatMessages
        .filter((message) => message.threadId === active?.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [data.chatMessages, active?.id],
  );

  function markRead(threadId: string) {
    if (!me) return;
    const now = new Date().toISOString();
    update((current) => {
      const rest = current.chatReadCursors.filter((item) => !(item.userId === me.id && item.threadId === threadId));
      return { ...current, chatReadCursors: [...rest, { userId: me.id, threadId, lastReadAt: now }] };
    });
  }

  useEffect(() => {
    if (!threadFromUrl) return;
    const match = data.chatThreads.find((thread) => thread.id === threadFromUrl);
    if (!match) return;
    setActiveId(match.id);
    setTab(match.kind);
    markRead(match.id);
  }, [threadFromUrl, data.chatThreads, me?.id, update]);

  function send() {
    if (!me || !active || (!text.trim() && !pendingFile)) return;
    const message: ChatMessage = {
      id: uid("msg"),
      threadId: active.id,
      senderUserId: me.id,
      body: text.trim() || (pendingFile ? `پیوست: ${pendingFile.name}` : ""),
      createdAt: new Date().toISOString(),
      attachmentName: pendingFile?.name,
      dataUrl: pendingFile?.dataUrl,
    };
    const preview = message.body.slice(0, 80);
    update((current) => ({
      ...current,
      chatMessages: [...current.chatMessages, message].slice(-400),
      chatThreads: current.chatThreads.map((thread) =>
        thread.id === active.id ? { ...thread, lastPreview: preview, lastAt: message.createdAt } : thread,
      ),
    }));
    setText("");
    setPendingFile(null);
    markRead(active.id);
  }

  function onPickFile(file: File) {
    if (file.size > 1_500_000) {
      setFlash("حجم پیوست زیاد است (حداکثر حدود ۱٫۵ مگابایت).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingFile({ name: file.name, dataUrl: String(reader.result) });
      setFlash(`فایل «${file.name}» آماده ارسال است.`);
    };
    reader.readAsDataURL(file);
  }

  return (
    <ModulePage slug="chat">
      <Flash>{flash}</Flash>
      <div className="flex h-[min(70vh,42rem)] flex-row-reverse overflow-hidden rounded-2xl border border-line bg-sheet shadow-sm" data-testid="chat-layout">
        <aside className="flex w-full max-w-sm flex-col border-l border-line bg-paper md:w-80" data-testid="chat-sidebar">
          <div className="flex gap-1 border-b border-line p-2">
            <Button type="button" tone={tab === "direct" ? "primary" : "ghost"} className="flex-1 text-xs" onClick={() => setTab("direct")}>شخصی</Button>
            <Button type="button" tone={tab === "group" ? "primary" : "ghost"} className="flex-1 text-xs" onClick={() => setTab("group")}>گروه‌ها</Button>
          </div>
          <div className="p-2">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در گفتگوها" aria-label="جستجو" />
          </div>
          <ul className="flex-1 overflow-y-auto">
            {threads.map((thread) => {
              const unread = me ? unreadForThread(data.chatMessages, thread.id, me.id, data.chatReadCursors) : 0;
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-3 text-right hover:bg-sand",
                      active?.id === thread.id && "bg-violet-50",
                    )}
                    onClick={() => {
                      setActiveId(thread.id);
                      markRead(thread.id);
                    }}
                    data-testid="chat-thread-item"
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {thread.title.slice(0, 1)}
                      <span className="absolute bottom-0 left-0 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-sm">{thread.title}</span>
                        {unread > 0 ? (
                          <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">{unread}</span>
                        ) : null}
                      </span>
                      <span className="line-clamp-1 text-xs text-muted">{thread.lastPreview}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          {active ? (
            <>
              <header className="flex items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <h2 className="font-bold">{active.title}</h2>
                  <p className="text-xs text-emerald-600">آنلاین</p>
                </div>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto p-4" data-testid="chat-messages">
                {messages.map((message) => {
                  const mine = message.senderUserId === me?.id;
                  const sender = data.users.find((user) => user.id === message.senderUserId)?.name ?? "—";
                  return (
                    <div key={message.id} className={cn("flex", mine ? "justify-start" : "justify-end")}>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                          mine ? "bg-primary text-white" : "border border-line bg-white text-ink",
                        )}
                      >
                        {!mine ? <p className="mb-1 text-[10px] font-semibold text-primary">{sender}</p> : null}
                        <p className="leading-7">{message.body}</p>
                        {message.dataUrl && message.attachmentName ? (
                          <a href={message.dataUrl} download={message.attachmentName} className="mt-1 block text-xs underline">
                            {message.attachmentName}
                          </a>
                        ) : null}
                        <p className="mt-1 text-[10px] opacity-70">{faDate(message.createdAt)}</p>
                        {message.reaction ? <span className="text-xs">{message.reaction}</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <footer className="border-t border-line p-3">
                <div className="flex flex-wrap items-end gap-2">
                  <input ref={fileRef} type="file" className="hidden" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onPickFile(file);
                  }} />
                  <Button type="button" tone="ghost" onClick={() => fileRef.current?.click()} aria-label="پیوست">📎</Button>
                  <div className="min-w-0 flex-1">
                    <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="پیام خود را بنویسید…" data-testid="chat-input" onKeyDown={(event) => { if (event.key === "Enter") send(); }} />
                  </div>
                  <Button type="button" onClick={send} data-testid="chat-send">ارسال</Button>
                </div>
              </footer>
            </>
          ) : (
            <Empty>گفتگویی انتخاب نشده است.</Empty>
          )}
        </main>
      </div>
    </ModulePage>
  );
}
