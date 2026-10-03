"use client";

import { useMemo, useRef, useState } from "react";
import { uid } from "@/lib/id";
import {
  DEFAULT_QUOTA_BYTES,
  deadlineBadge,
  filesForUser,
  formatBytes,
  quotaForUser,
  STICKY_COLORS,
  STICKY_LABELS,
  todosForUser,
  usedBytesForUser,
} from "@/lib/reporter-workspace";
import { useNewsroom } from "@/lib/store";
import type { ReporterFileEntry, ReporterStickyNote, ReporterTodo, StickyNoteLabel, TodoPriority } from "@/lib/types";
import { currentRole, currentUser } from "@/lib/workflow";
import { JalaliDateTimePicker } from "@/components/jalali-datetime-picker";
import { formatJalaliDateTime } from "@/lib/jalali";
import { faDate, faNum } from "@/lib/format";
import { Button, Empty, Field, Flash, Input, ModulePage, Select, TextArea, cn } from "../ui";

function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="بستن" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-sheet p-5 shadow-xl">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="mt-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}

export function ReporterTodoScreen() {
  const { data, update } = useNewsroom();
  const user = currentUser(data);
  const [flash, setFlash] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueIso, setDueIso] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("normal");

  const items = useMemo(() => (user ? todosForUser(data, user.id) : []), [data, user]);

  function persistTodos(next: ReporterTodo[]) {
    if (!user) return;
    update((current) => ({
      ...current,
      reporterTodos: [
        ...current.reporterTodos.filter((todo) => todo.userId !== user.id),
        ...next,
      ],
    }));
  }

  function toggleDone(id: string) {
    persistTodos(items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function toggleFavorite(id: string) {
    persistTodos(items.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item)));
  }

  function removeTodo(id: string) {
    update((current) => ({ ...current, reporterTodos: current.reporterTodos.filter((item) => item.id !== id) }));
    setFlash("کار حذف شد.");
  }

  function moveTodo(id: string, dir: -1 | 1) {
    const index = items.findIndex((item) => item.id === id);
    const swap = index + dir;
    if (swap < 0 || swap >= items.length) return;
    const next = [...items];
    const a = next[index]!.sortOrder;
    next[index]!.sortOrder = next[swap]!.sortOrder;
    next[swap]!.sortOrder = a;
    persistTodos(next);
  }

  function addTodo() {
    if (!user || !title.trim() || !dueIso) {
      setFlash("عنوان و تاریخ سررسید لازم است.");
      return;
    }
    const todo: ReporterTodo = {
      id: uid("todo"),
      userId: user.id,
      title: title.trim(),
      done: false,
      favorite: false,
      priority,
      sortOrder: items.length,
      dueAt: dueIso,
      createdAt: new Date().toISOString(),
    };
    update((current) => ({ ...current, reporterTodos: [...current.reporterTodos, todo] }));
    setTitle("");
    setDueIso("");
    setModalOpen(false);
    setFlash("کار جدید اضافه شد.");
  }

  return (
    <ModulePage slug="my-tasks">
      <Flash>{flash}</Flash>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">لیست کارهای شخصی با سررسید و اولویت.</p>
        <Button type="button" onClick={() => setModalOpen(true)} data-testid="todo-add-btn">افزودن کار</Button>
      </div>
      <div className="mt-4 space-y-2" data-testid="todo-list">
        {items.length === 0 ? <Empty>کار ثبت نشده است.</Empty> : null}
        {items.map((item) => {
          const badge = deadlineBadge(item.dueAt, item.done);
          return (
            <div
              key={item.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border border-line bg-sheet px-3 py-3 shadow-sm",
                item.done && "opacity-70",
              )}
              data-testid="todo-item"
            >
              <span className="cursor-grab text-muted" title="جابجایی">
                <button type="button" className="px-1" onClick={() => moveTodo(item.id, -1)} aria-label="بالا">▲</button>
                <button type="button" className="px-1" onClick={() => moveTodo(item.id, 1)} aria-label="پایین">▼</button>
              </span>
              <input type="checkbox" checked={item.done} onChange={() => toggleDone(item.id)} aria-label="انجام شد" />
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium", item.done && "line-through text-muted")}>{item.title}</p>
                <p className="text-xs text-muted" data-testid="todo-due-jalali">{formatJalaliDateTime(item.dueAt)} · {item.priority}</p>
              </div>
              {badge ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    badge.tone === "danger" && "bg-red-100 text-red-800",
                    badge.tone === "warn" && "bg-amber-100 text-amber-900",
                  )}
                  data-testid="todo-deadline-badge"
                >
                  {badge.text}
                </span>
              ) : null}
              <button type="button" onClick={() => toggleFavorite(item.id)} aria-label="ستاره" className={item.favorite ? "text-amber-500" : "text-muted"}>
                ★
              </button>
              <Button type="button" tone="quiet" className="text-xs text-red-700" onClick={() => removeTodo(item.id)}>حذف</Button>
            </div>
          );
        })}
      </div>
      <Modal open={modalOpen} title="کار جدید" onClose={() => setModalOpen(false)}>
        <Field label="عنوان کار">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} data-testid="todo-form-title" />
        </Field>
        <JalaliDateTimePicker label="سررسید (تاریخ و زمان شمسی)" value={dueIso} onChange={setDueIso} testId="todo-form-due" />
        <Field label="اولویت">
          <Select value={priority} onChange={(event) => setPriority(event.target.value as TodoPriority)}>
            <option value="low">کم</option>
            <option value="normal">معمولی</option>
            <option value="high">بالا</option>
          </Select>
        </Field>
        <Button type="button" onClick={addTodo} data-testid="todo-form-save">ذخیره</Button>
      </Modal>
    </ModulePage>
  );
}

export function ReporterNotesScreen() {
  const { data, update } = useNewsroom();
  const user = currentUser(data);
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState("");
  const [form, setForm] = useState({ title: "", body: "", label: "work" as StickyNoteLabel });

  const notes = useMemo(() => {
    if (!user) return [];
    return data.reporterStickyNotes
      .filter((note) => note.userId === user.id)
      .filter((note) => {
        if (!query.trim()) return true;
        const hay = `${note.title} ${note.body}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      })
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt));
  }, [data.reporterStickyNotes, user, query]);

  function saveNote() {
    if (!user || !form.title.trim()) return;
    const now = new Date().toISOString();
    const note: ReporterStickyNote = {
      id: uid("note"),
      userId: user.id,
      title: form.title.trim(),
      body: form.body.trim(),
      label: form.label,
      color: form.label,
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };
    update((current) => ({ ...current, reporterStickyNotes: [note, ...current.reporterStickyNotes] }));
    setForm({ title: "", body: "", label: "work" });
    setFlash("یادداشت ذخیره شد.");
  }

  function toggleFavorite(id: string) {
    update((current) => ({
      ...current,
      reporterStickyNotes: current.reporterStickyNotes.map((note) =>
        note.id === id ? { ...note, favorite: !note.favorite, updatedAt: new Date().toISOString() } : note,
      ),
    }));
  }

  function removeNote(id: string) {
    update((current) => ({ ...current, reporterStickyNotes: current.reporterStickyNotes.filter((note) => note.id !== id) }));
  }

  return (
    <ModulePage slug="my-notes">
      <Flash>{flash}</Flash>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در یادداشت‌ها" className="sm:max-w-xs" aria-label="جستجو" />
      </div>
      <form className="mt-4 grid gap-2 rounded-2xl border border-line bg-sheet p-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); saveNote(); }} data-testid="notes-form">
        <Field label="عنوان">
          <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </Field>
        <Field label="دسته">
          <Select value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value as StickyNoteLabel })}>
            {Object.entries(STICKY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Field label="متن">
            <TextArea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} rows={3} />
          </Field>
        </div>
        <Button type="submit" data-testid="notes-add-btn">افزودن یادداشت جدید</Button>
      </form>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="notes-grid">
        {notes.map((note) => (
          <article key={note.id} className={cn("rounded-2xl border p-4 shadow-sm", STICKY_COLORS[note.label] ?? "bg-sheet")} data-testid="note-card">
            <div className="flex items-start justify-between gap-2">
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold">{STICKY_LABELS[note.label]}</span>
              <button type="button" className={note.favorite ? "text-amber-500" : "text-muted"} onClick={() => toggleFavorite(note.id)} aria-label="موردعلاقه">★</button>
            </div>
            <h3 className="mt-2 font-bold">{note.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-700">{note.body || "—"}</p>
            <div className="mt-3 flex justify-between text-xs text-muted">
              <span>{faDate(note.updatedAt)}</span>
              <button type="button" className="text-red-700" onClick={() => removeNote(note.id)}>حذف</button>
            </div>
          </article>
        ))}
      </div>
    </ModulePage>
  );
}

export function ReporterFileManagerScreen() {
  const { data, update } = useNewsroom();
  const user = currentUser(data);
  const role = currentRole(data);
  const canManageQuota = role.base === "publisher" || role.base === "chief";
  const [folderId, setFolderId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [newName, setNewName] = useState("");
  const [shareUserId, setShareUserId] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = user?.id ?? "";
  const quota = userId ? quotaForUser(data, userId) : DEFAULT_QUOTA_BYTES;
  const used = userId ? usedBytesForUser(data, userId) : 0;
  const pct = Math.min(100, Math.round((used / quota) * 100));

  const visible = userId ? filesForUser(data, userId).filter((file) => file.parentId === folderId) : [];
  const folders = userId ? filesForUser(data, userId).filter((file) => file.kind === "folder") : [];

  function resolveUploadParentId(): string | null {
    if (folders.length > 0) return uploadFolderId;
    return folderId;
  }

  function openFolder(id: string | null) {
    setFolderId(id);
    setUploadFolderId(id);
  }

  function addFolder() {
    if (!user || !newName.trim()) return;
    const entry: ReporterFileEntry = {
      id: uid("fld"),
      ownerUserId: user.id,
      parentId: folderId,
      name: newName.trim(),
      kind: "folder",
      sizeBytes: 0,
      mime: "",
      sharedWith: [],
      createdAt: new Date().toISOString(),
    };
    update((current) => ({ ...current, reporterFiles: [...current.reporterFiles, entry] }));
    setNewName("");
    setFlash("پوشه ساخته شد.");
  }

  function ingestFiles(fileList: FileList | File[]) {
    if (!user) return;
    const targetParentId = resolveUploadParentId();
    const files = Array.from(fileList);
    let added = 0;
    const folderName = targetParentId ? folders.find((folder) => folder.id === targetParentId)?.name : "ریشه";
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
        const size = file.size;
        if (usedBytesForUser({ ...data, reporterFiles: data.reporterFiles } as typeof data, user.id) + size > quota) {
          setFlash("سهمیه فضا تکمیل شده است.");
          return;
        }
        const entry: ReporterFileEntry = {
          id: uid("fil"),
          ownerUserId: user.id,
          parentId: targetParentId,
          name: file.name,
          kind: "file",
          sizeBytes: size,
          mime: file.type || "application/octet-stream",
          sharedWith: [],
          createdAt: new Date().toISOString(),
          dataUrl: size <= 1_500_000 ? dataUrl : undefined,
          lastModified: new Date(file.lastModified).toISOString(),
        };
        update((current) => ({ ...current, reporterFiles: [...current.reporterFiles, entry] }));
        added += 1;
        if (added === files.length) {
          setFolderId(targetParentId);
          setUploadFolderId(targetParentId);
          setFlash(`${faNum(added)} فایل در پوشه «${folderName ?? "ریشه"}» بارگذاری شد.`);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function shareFile(fileId: string) {
    if (!shareUserId) return;
    update((current) => ({
      ...current,
      reporterFiles: current.reporterFiles.map((file) =>
        file.id === fileId
          ? {
              ...file,
              sharedWith: [...file.sharedWith, { scope: "user", userId: shareUserId, canDownload: true }],
            }
          : file,
      ),
    }));
    setFlash("فایل با خبرنگار انتخاب‌شده به اشتراک گذاشته شد.");
    setSelectedFile(null);
  }

  function setQuotaForReporter(userId: string, mb: number) {
    const quotaBytes = mb * 1024 * 1024;
    update((current) => {
      const rest = current.reporterStorageQuotas.filter((item) => item.userId !== userId);
      return { ...current, reporterStorageQuotas: [...rest, { userId, quotaBytes }] };
    });
    setFlash("سهمیه به‌روز شد.");
  }

  const reporters = data.users.filter((u) => data.roles.find((r) => r.id === u.roleId)?.base === "reporter");

  return (
    <ModulePage slug="file-manager">
      <Flash>{flash}</Flash>
      <div className="rounded-2xl border border-line bg-sheet p-4" data-testid="storage-quota-bar">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span>مصرف فضا</span>
          <span className="font-semibold">{formatBytes(used)} از {formatBytes(quota)}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted">{faNum(pct)}٪ استفاده شده</p>
      </div>
      {canManageQuota ? (
        <div className="mt-4 rounded-xl border border-dashed border-line bg-paper p-3 text-sm">
          <p className="font-semibold">تنظیم سهمیه خبرنگاران (مدیر)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {reporters.map((rep) => (
              <Button key={rep.id} type="button" tone="ghost" className="text-xs" onClick={() => setQuotaForReporter(rep.id, 2048)}>
                {rep.name}: ۲ گیگ
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid gap-4 lg:grid-cols-[14rem_1fr]">
        <aside className="rounded-xl border border-line bg-sheet p-3 text-sm">
          <p className="font-bold">پوشه‌ها</p>
          <button
            type="button"
            className="mt-2 block w-full text-right text-primary hover:underline"
            onClick={() => openFolder(null)}
          >
            ریشه
          </button>
          <ul className="mt-1 space-y-1">
            {folders.map((folder) => (
              <li key={folder.id}>
                <button
                  type="button"
                  className="hover:text-primary"
                  onClick={() => openFolder(folder.id)}
                >
                  {folder.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-1">
            <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="پوشه جدید" className="text-xs" />
            <Button type="button" tone="ghost" className="text-xs" onClick={addFolder}>+</Button>
          </div>
        </aside>
        <div>
          <div
            className={cn(
              "mb-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
              dragOver ? "border-primary bg-violet-50" : "border-line bg-paper",
            )}
            data-testid="file-drop-zone"
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              if (event.dataTransfer.files.length) ingestFiles(event.dataTransfer.files);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              data-testid="file-upload-input"
              onChange={(event) => {
                if (event.target.files?.length) ingestFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <p className="text-sm text-muted">فایل را اینجا بکشید و رها کنید یا از رایانه انتخاب کنید.</p>
            {folders.length > 0 ? (
              <div className="mx-auto mt-3 max-w-sm text-right">
                <Field label="پوشه مقصد برای بارگذاری">
                  <Select
                    value={uploadFolderId ?? ""}
                    data-testid="file-upload-folder-select"
                    onChange={(event) => setUploadFolderId(event.target.value ? event.target.value : null)}
                  >
                    <option value="">پوشه اصلی / ریشه</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            ) : null}
            <Button type="button" className="mt-3" onClick={() => fileInputRef.current?.click()} data-testid="file-upload-btn">
              انتخاب فایل از رایانه
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2" data-testid="file-grid">
            {visible.length === 0 ? <Empty>فایلی در این مسیر نیست.</Empty> : null}
            {visible.map((file) => (
              <div key={file.id} className="rounded-xl border border-line bg-sheet p-3 text-sm">
                <p className="font-semibold">{file.name}</p>
                <p className="text-xs text-muted">{file.kind === "folder" ? "پوشه" : formatBytes(file.sizeBytes)}</p>
                {file.kind === "file" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {file.dataUrl ? (
                      <a href={file.dataUrl} download={file.name} className="text-xs font-medium text-primary hover:underline">دانلود</a>
                    ) : null}
                    <Button type="button" tone="ghost" className="text-xs" onClick={() => setSelectedFile(file.id)}>اشتراک‌گذاری</Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Modal open={Boolean(selectedFile)} title="اشتراک فایل" onClose={() => setSelectedFile(null)}>
        <Field label="خبرنگار">
          <Select value={shareUserId} onChange={(event) => setShareUserId(event.target.value)}>
            <option value="">انتخاب کنید</option>
            {reporters.map((rep) => (
              <option key={rep.id} value={rep.id}>{rep.name}</option>
            ))}
          </Select>
        </Field>
        <Button type="button" onClick={() => selectedFile && shareFile(selectedFile)}>اشتراک</Button>
      </Modal>
    </ModulePage>
  );
}
