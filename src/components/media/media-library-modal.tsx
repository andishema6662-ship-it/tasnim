"use client";

import { useRef, useState } from "react";
import { faDate, faNum } from "@/lib/format";
import { uid } from "@/lib/id";
import { addMediaItem, mediaCopyUrl, readImageFile } from "@/lib/media-library";
import { useNewsroom } from "@/lib/store";
import type { MediaItem } from "@/lib/types";
import { CoverThumb } from "../cover-thumb";
import { Button, Flash, Input } from "../ui";
import { ImageCropper } from "./image-cropper";

type Tab = "upload" | "library";

export function MediaLibraryModal({
  open,
  title = "کتابخانه رسانه",
  confirmLabel = "تنظیم به عنوان عکس شاخص",
  onClose,
  onPick,
}: {
  open: boolean;
  title?: string;
  confirmLabel?: string;
  onClose: () => void;
  onPick: (src: string, item?: MediaItem) => void;
}) {
  const { data, update } = useNewsroom();
  const [tab, setTab] = useState<Tab>("library");
  const [flash, setFlash] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(data.mediaLibrary[0]?.id ?? null);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const [pendingMeta, setPendingMeta] = useState<{ fileName: string; mimeType: string; width: number; height: number } | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  if (!open) return null;

  const selected = data.mediaLibrary.find((item) => item.id === selectedId) ?? null;

  async function ingestFile(file: File) {
    try {
      const loaded = await readImageFile(file);
      setPendingSrc(loaded.dataUrl);
      setPendingMeta({ fileName: file.name, mimeType: loaded.mimeType, width: loaded.width, height: loaded.height });
      setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
      setTab("upload");
      setFlash("");
    } catch (error) {
      setFlash(error instanceof Error && error.message === "too-large" ? "حجم تصویر زیاد است (حداکثر ۲٫۵ مگابایت)." : "بارگذاری تصویر ممکن نشد.");
    }
  }

  function saveToLibrary(dataUrl: string, width: number, height: number, meta: { fileName: string; mimeType: string; title: string }) {
    const id = uid("med");
    const item: MediaItem = {
      id,
      createdAt: new Date().toISOString(),
      title: meta.title.trim() || meta.fileName,
      fileName: meta.fileName,
      src: dataUrl,
      width,
      height,
      mimeType: meta.mimeType,
    };
    update((current) => addMediaItem(current, item));
    setPendingSrc(null);
    setPendingMeta(null);
    setSelectedId(id);
    setFlash("تصویر در کتابخانه ذخیره شد.");
    return item;
  }

  function copyLink(item: MediaItem) {
    void navigator.clipboard.writeText(mediaCopyUrl(item));
    setFlash("پیوند تصویر در حافظه کپی شد.");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-ink/50" aria-label="بستن" onClick={onClose} />
      <div className="relative flex max-h-[min(92vh,52rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-line bg-sheet shadow-xl">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" className="text-sm text-muted" onClick={onClose}>بستن</button>
        </header>
        <div className="flex border-b border-line text-sm">
          <button
            type="button"
            className={`flex-1 px-4 py-2 ${tab === "upload" ? "border-b-2 border-ink font-semibold" : "text-muted"}`}
            onClick={() => setTab("upload")}
          >
            بارگذاری پرونده‌ها
          </button>
          <button
            type="button"
            className={`flex-1 px-4 py-2 ${tab === "library" ? "border-b-2 border-ink font-semibold" : "text-muted"}`}
            onClick={() => setTab("library")}
          >
            کتابخانه پرونده‌های چندرسانه‌ای
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <Flash>{flash}</Flash>
          {tab === "upload" ? (
            <div className="space-y-4">
              {!pendingSrc ? (
                <div
                  className={`grid place-items-center rounded-lg border-2 border-dashed px-6 py-12 text-center ${dragOver ? "border-ink bg-sand/50" : "border-line"}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) void ingestFile(file);
                  }}
                >
                  <p className="text-sm">فایل را اینجا بکشید یا از رایانه انتخاب کنید</p>
                  <Button type="button" className="mt-3" tone="ghost" onClick={() => fileRef.current?.click()}>انتخاب تصویر</Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void ingestFile(file);
                  }} />
                </div>
              ) : (
                <div className="space-y-3">
                  <Input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="عنوان تصویر" aria-label="عنوان تصویر" />
                  <ImageCropper
                    src={pendingSrc}
                    mimeType={pendingMeta?.mimeType}
                    onCancel={() => {
                      setPendingSrc(null);
                      setPendingMeta(null);
                    }}
                    onApply={(dataUrl, width, height) => {
                      if (!pendingMeta) return;
                      const saved = saveToLibrary(dataUrl, width, height, {
                        fileName: pendingMeta.fileName,
                        mimeType: pendingMeta.mimeType,
                        title: uploadTitle,
                      });
                      setTab("library");
                      if (saved) onPick(dataUrl, saved);
                    }}
                  />
                  <Button
                    type="button"
                    tone="ghost"
                    onClick={() => {
                      if (!pendingMeta || !pendingSrc) return;
                      const saved = saveToLibrary(pendingSrc, pendingMeta.width, pendingMeta.height, {
                        fileName: pendingMeta.fileName,
                        mimeType: pendingMeta.mimeType,
                        title: uploadTitle,
                      });
                      setTab("library");
                      if (saved) onPick(pendingSrc, saved);
                    }}
                  >
                    ذخیره بدون برش
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {data.mediaLibrary.length === 0 ? <p className="text-sm text-muted">هنوز تصویری بارگذاری نشده است.</p> : null}
                {data.mediaLibrary.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`overflow-hidden rounded-md border text-right ${selectedId === item.id ? "border-ink ring-2 ring-ink/20" : "border-line"}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <CoverThumb cover={item.src} className="h-28 w-full" />
                    <span className="block px-2 py-1 text-xs font-medium leading-5">{item.title}</span>
                  </button>
                ))}
              </div>
              {selected ? (
                <aside className="space-y-2 rounded-md border border-line bg-paper p-3 text-sm">
                  <CoverThumb cover={selected.src} className="h-32 w-full rounded-md" />
                  <p className="font-semibold">{selected.title}</p>
                  <p className="text-xs text-muted">{selected.fileName}</p>
                  <p className="text-xs text-muted">{faNum(selected.width)} × {faNum(selected.height)} · {faDate(selected.createdAt)}</p>
                  <Button type="button" tone="ghost" className="w-full" onClick={() => copyLink(selected)}>کپی پیوند تصویر</Button>
                </aside>
              ) : null}
            </div>
          )}
        </div>
        <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-4 py-3">
          <Button type="button" tone="ghost" onClick={onClose}>انصراف</Button>
          {tab === "library" && selected ? (
            <Button type="button" onClick={() => onPick(selected.src, selected)}>{confirmLabel}</Button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
