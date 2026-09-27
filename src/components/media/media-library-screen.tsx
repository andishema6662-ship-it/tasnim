"use client";

import { useRef, useState } from "react";
import { faDate, faNum } from "@/lib/format";
import { addMediaItem, mediaCopyUrl, readImageFile, removeMediaItem, updateMediaItem } from "@/lib/media-library";
import { useNewsroom } from "@/lib/store";
import { CoverThumb } from "../cover-thumb";
import { Button, Flash, Input, ModulePage, Notice } from "../ui";
import { ImageCropper } from "./image-cropper";

export function MediaLibraryScreen() {
  const { data, update } = useNewsroom();
  const [flash, setFlash] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(data.mediaLibrary[0]?.id ?? null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const selected = data.mediaLibrary.find((item) => item.id === selectedId) ?? null;

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    try {
      const loaded = await readImageFile(file);
      update((current) =>
        addMediaItem(current, {
          title: file.name.replace(/\.[^.]+$/, ""),
          fileName: file.name,
          src: loaded.dataUrl,
          width: loaded.width,
          height: loaded.height,
          mimeType: loaded.mimeType,
        }),
      );
      setFlash("تصویر به کتابخانه اضافه شد.");
    } catch {
      setFlash("بارگذاری ممکن نشد. حجم یا نوع فایل را بررسی کنید.");
    }
  }

  return (
    <ModulePage slug="library">
      <Notice>کتابخانه رسانه مانند وردپرس: بارگذاری، برش، کپی پیوند، و استفاده در عکس شاخص خبر.</Notice>
      <Flash>{flash}</Flash>
      <div
        className="rounded-lg border-2 border-dashed border-line bg-sheet px-4 py-10 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void onFiles(event.dataTransfer.files);
        }}
      >
        <p className="text-sm">تصویر را بکشید و رها کنید یا</p>
        <Button type="button" className="mt-2" tone="ghost" onClick={() => fileRef.current?.click()}>بارگذاری تصویر</Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => void onFiles(event.target.files)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.mediaLibrary.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`overflow-hidden rounded-lg border bg-sheet text-right ${selectedId === item.id ? "border-ink" : "border-line"}`}
              onClick={() => {
                setSelectedId(item.id);
                setCropSrc(null);
              }}
            >
              <CoverThumb cover={item.src} className="h-32 w-full" />
              <div className="px-2 py-2">
                <p className="text-sm font-semibold leading-6">{item.title}</p>
                <p className="text-xs text-muted">{faNum(item.width)}×{faNum(item.height)}</p>
              </div>
            </button>
          ))}
        </div>
        {selected ? (
          <aside className="space-y-3 rounded-lg border border-line bg-sheet p-4">
            <CoverThumb cover={selected.src} className="h-40 w-full rounded-md" />
            <Input
              value={selected.title}
              aria-label="عنوان"
              onChange={(event) => {
                const title = event.target.value;
                update((current) => updateMediaItem(current, selected.id, { title }));
              }}
            />
            <p className="text-xs text-muted">{selected.fileName} · {faDate(selected.createdAt)}</p>
            <Button type="button" tone="ghost" className="w-full" onClick={() => {
              void navigator.clipboard.writeText(mediaCopyUrl(selected));
              setFlash("پیوند تصویر کپی شد.");
            }}>
              کپی پیوند تصویر
            </Button>
            <Button type="button" tone="ghost" className="w-full" onClick={() => setCropSrc(selected.src)}>برش تصویر</Button>
            <Button type="button" tone="quiet" className="w-full" onClick={() => {
              update((current) => removeMediaItem(current, selected.id));
              setSelectedId(null);
              setCropSrc(null);
              setFlash("تصویر حذف شد.");
            }}>
              حذف از کتابخانه
            </Button>
            {cropSrc ? (
              <ImageCropper
                src={cropSrc}
                mimeType={selected.mimeType}
                onCancel={() => setCropSrc(null)}
                onApply={(dataUrl, width, height) => {
                  update((current) => updateMediaItem(current, selected.id, { src: dataUrl, width, height }));
                  setCropSrc(null);
                  setFlash("برش ذخیره شد.");
                }}
              />
            ) : null}
          </aside>
        ) : null}
      </div>
    </ModulePage>
  );
}
