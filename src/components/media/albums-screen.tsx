"use client";

import { useMemo, useRef, useState } from "react";
import { ALBUM_PLACEMENT_LABEL, normalizeAlbum } from "@/lib/albums";
import { faDate } from "@/lib/format";
import { uid } from "@/lib/id";
import { readImageFile } from "@/lib/media-library";
import { useNewsroom } from "@/lib/store";
import type { Album, AlbumPlacement, Photo } from "@/lib/types";
import { CoverThumb } from "../cover-thumb";
import { Button, Empty, Field, Flash, Input, ModulePage, Notice, Select, TextArea } from "../ui";

type Draft = {
  id: string | null;
  title: string;
  description: string;
  photographer: string;
  placement: AlbumPlacement;
  serviceId: string;
  photos: Photo[];
};

function emptyDraft(): Draft {
  return { id: null, title: "", description: "", photographer: "", placement: "dedicated", serviceId: "", photos: [] };
}

function draftFromAlbum(album: Album): Draft {
  return {
    id: album.id,
    title: album.title,
    description: album.description,
    photographer: album.photographer,
    placement: album.placement,
    serviceId: album.serviceId,
    photos: [...album.photos],
  };
}

export function AlbumsScreen() {
  const { data, update } = useNewsroom();
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [flash, setFlash] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pickedLibrary, setPickedLibrary] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const editingExisting = draft.id !== null;

  async function ingestFiles(files: FileList | null) {
    if (!files?.length) return;
    const added: Photo[] = [];
    for (const file of Array.from(files)) {
      try {
        const loaded = await readImageFile(file);
        added.push({ id: uid("ph"), caption: file.name.replace(/\.[^.]+$/, ""), src: loaded.dataUrl });
      } catch {
        setFlash("یکی از فایل‌ها بارگذاری نشد (نوع یا حجم).");
      }
    }
    if (added.length) {
      setDraft((current) => ({ ...current, photos: [...current.photos, ...added] }));
      setFlash(`${added.length} تصویر به پیش‌نمایش اضافه شد.`);
    }
  }

  function persist(status: Album["status"]) {
    if (!draft.title.trim()) {
      setFlash("تیتر آلبوم را بنویسید.");
      return;
    }
    if (!draft.photographer.trim()) {
      setFlash("نام عکاس را وارد کنید.");
      return;
    }
    if (draft.photos.length === 0) {
      setFlash("حداقل یک تصویر انتخاب کنید.");
      return;
    }
    if (draft.placement === "service" && !draft.serviceId) {
      setFlash("سرویس خبری را برای محل انتشار انتخاب کنید.");
      return;
    }
    const ts = new Date().toISOString();
    const id = draft.id ?? uid("alb");
    const existing = data.albums.find((item) => item.id === id);
    const album = normalizeAlbum({
      id,
      title: draft.title.trim(),
      description: draft.description.trim(),
      photographer: draft.photographer.trim(),
      photos: draft.photos,
      placement: draft.placement,
      serviceId: draft.serviceId,
      status,
      createdAt: existing?.createdAt ?? ts,
      updatedAt: ts,
      publishedAt: status === "published" ? existing?.publishedAt ?? ts : existing?.publishedAt,
    });
    update((current) => {
      const exists = current.albums.some((item) => item.id === id);
      const albums = exists ? current.albums.map((item) => (item.id === id ? album : item)) : [album, ...current.albums];
      return { ...current, albums };
    });
    setDraft(draftFromAlbum(album));
    setFlash(status === "published" ? "آلبوم منتشر شد و در خروجی سایت دیده می‌شود." : "پیش‌نویس آلبوم ذخیره شد.");
  }

  function removePhoto(photoId: string) {
    setDraft((current) => ({ ...current, photos: current.photos.filter((item) => item.id !== photoId) }));
  }

  function movePhoto(photoId: string, dir: -1 | 1) {
    setDraft((current) => {
      const index = current.photos.findIndex((item) => item.id === photoId);
      if (index < 0) return current;
      const next = index + dir;
      if (next < 0 || next >= current.photos.length) return current;
      const photos = [...current.photos];
      const [item] = photos.splice(index, 1);
      photos.splice(next, 0, item);
      return { ...current, photos };
    });
  }

  const librarySelection = useMemo(() => data.mediaLibrary.filter((item) => pickedLibrary.has(item.id)), [data.mediaLibrary, pickedLibrary]);

  return (
    <ModulePage slug="albums">
      <Notice>گزارش تصویری: تیتر، توضیح، عکاس، بارگذاری چندتایی، پیش‌نمایش، محل انتشار و انتشار در سایت.</Notice>
      <Flash>{flash}</Flash>
      <form
        className="space-y-4 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <h2 className="font-bold">{editingExisting ? "ویرایش آلبوم" : "آلبوم تصویری تازه"}</h2>
        <Field label="تیتر آلبوم">
          <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="تیتر گزارش تصویری" />
        </Field>
        <Field label="توضیحات آلبوم">
          <TextArea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="خلاصه و زاویه گزارش" />
        </Field>
        <Field label="نام عکاس">
          <Input value={draft.photographer} onChange={(event) => setDraft({ ...draft, photographer: event.target.value })} placeholder="مثلاً پویا کرمی" />
        </Field>
        <div
          className="rounded-lg border-2 border-dashed border-line px-4 py-8 text-center"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void ingestFiles(event.dataTransfer.files);
          }}
        >
          <p className="text-sm">چند تصویر را همزمان بکشید یا انتخاب کنید</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button type="button" tone="ghost" onClick={() => fileRef.current?.click()}>انتخاب چند پرونده</Button>
            <Button type="button" tone="ghost" onClick={() => setLibraryOpen(true)}>از کتابخانه رسانه</Button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => void ingestFiles(event.target.files)} />
        </div>
        {draft.photos.length ? (
          <div>
            <p className="text-sm font-medium">پیش‌نمایش تصاویر ({draft.photos.length})</p>
            <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {draft.photos.map((photo, index) => (
                <li key={photo.id} className="rounded-md border border-line bg-paper p-2">
                  <CoverThumb cover={photo.src} className="h-20 w-full rounded" />
                  <Input
                    className="mt-2 text-xs"
                    value={photo.caption}
                    aria-label="شرح تصویر"
                    onChange={(event) => {
                      const caption = event.target.value;
                      setDraft((current) => ({
                        ...current,
                        photos: current.photos.map((item) => (item.id === photo.id ? { ...item, caption } : item)),
                      }));
                    }}
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    <button type="button" className="text-xs text-muted" disabled={index === 0} onClick={() => movePhoto(photo.id, -1)}>◀</button>
                    <button type="button" className="text-xs text-muted" disabled={index === draft.photos.length - 1} onClick={() => movePhoto(photo.id, 1)}>▶</button>
                    <button type="button" className="text-xs text-rule" onClick={() => removePhoto(photo.id)}>حذف</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Field label="انتخاب محل انتشار">
          <Select value={draft.placement} onChange={(event) => setDraft({ ...draft, placement: event.target.value as AlbumPlacement })}>
            {(Object.keys(ALBUM_PLACEMENT_LABEL) as AlbumPlacement[]).map((key) => (
              <option key={key} value={key}>{ALBUM_PLACEMENT_LABEL[key]}</option>
            ))}
          </Select>
        </Field>
        {draft.placement === "service" ? (
          <Field label="سرویس خبری">
            <Select value={draft.serviceId} onChange={(event) => setDraft({ ...draft, serviceId: event.target.value })}>
              <option value="">انتخاب سرویس</option>
              {data.services.filter((item) => item.active).map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </Select>
          </Field>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => persist("draft")}>ذخیره پیش‌نویس</Button>
          <Button type="button" tone="accent" onClick={() => persist("published")}>انتشار</Button>
          {editingExisting ? (
            <Button type="button" tone="ghost" onClick={() => setDraft(emptyDraft())}>آلبوم تازه</Button>
          ) : null}
        </div>
      </form>
      {libraryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-ink/50" aria-label="بستن" onClick={() => setLibraryOpen(false)} />
          <div className="relative max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-line bg-sheet p-4">
            <h3 className="font-bold">انتخاب از کتابخانه</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {data.mediaLibrary.map((item) => {
                const on = pickedLibrary.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`rounded border p-1 text-right ${on ? "border-ink ring-2 ring-ink/20" : "border-line"}`}
                    onClick={() => {
                      setPickedLibrary((current) => {
                        const next = new Set(current);
                        if (next.has(item.id)) next.delete(item.id);
                        else next.add(item.id);
                        return next;
                      });
                    }}
                  >
                    <CoverThumb cover={item.src} className="h-20 w-full" />
                    <span className="block px-1 py-1 text-xs">{item.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" tone="ghost" onClick={() => setLibraryOpen(false)}>انصراف</Button>
              <Button
                type="button"
                onClick={() => {
                  const added = librarySelection.map((item) => ({ id: uid("ph"), caption: item.title, src: item.src }));
                  setDraft((current) => ({ ...current, photos: [...current.photos, ...added] }));
                  setPickedLibrary(new Set());
                  setLibraryOpen(false);
                  setFlash(`${added.length} تصویر از کتابخانه اضافه شد.`);
                }}
              >
                افزودن به آلبوم
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <h2 className="text-lg font-bold">آلبوم‌های ذخیره‌شده</h2>
      {data.albums.length === 0 ? <Empty>آلبومی نیست.</Empty> : null}
      <ul className="space-y-3">
        {data.albums.map((album) => (
          <li key={album.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-sheet px-4 py-3">
            <div>
              <p className="font-semibold">{album.title}</p>
              <p className="text-xs text-muted">
                {album.photographer} · {album.status === "published" ? "منتشرشده" : "پیش‌نویس"} · {ALBUM_PLACEMENT_LABEL[album.placement]} · {faDate(album.updatedAt)}
              </p>
            </div>
            <Button type="button" tone="ghost" onClick={() => setDraft(draftFromAlbum(album))}>ویرایش</Button>
          </li>
        ))}
      </ul>
    </ModulePage>
  );
}
