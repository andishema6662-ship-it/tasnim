"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cropImageToDataUrl, loadImageElement } from "@/lib/media-library";
import { Button, Select } from "../ui";

export type CropAspect = "free" | "16:9" | "4:3" | "1:1";

const aspectValue: Record<CropAspect, number | null> = {
  free: null,
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
};

export function ImageCropper({
  src,
  mimeType,
  onCancel,
  onApply,
}: {
  src: string;
  mimeType?: string;
  onCancel: () => void;
  onApply: (dataUrl: string, width: number, height: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [aspect, setAspect] = useState<CropAspect>("16:9");
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ mode: "move" | "resize"; startX: number; startY: number; base: typeof crop } | null>(null);

  useEffect(() => {
    loadImageElement(src).then((img) => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setNatural({ w, h });
      const ratio = aspectValue["16:9"];
      let cw = w * 0.8;
      let ch = ratio ? cw / ratio : h * 0.8;
      if (ch > h * 0.9) {
        ch = h * 0.8;
        cw = ratio ? ch * ratio : w * 0.8;
      }
      setCrop({ x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch });
    });
  }, [src]);

  function applyAspect(nextAspect: CropAspect) {
    setAspect(nextAspect);
    if (!natural.w) return;
    const ratio = aspectValue[nextAspect];
    if (!ratio) return;
    setCrop((current) => {
      let w = current.w;
      let h = w / ratio;
      if (h > natural.h) {
        h = natural.h * 0.85;
        w = h * ratio;
      }
      if (w > natural.w) {
        w = natural.w * 0.85;
        h = w / ratio;
      }
      return { x: Math.min(current.x, natural.w - w), y: Math.min(current.y, natural.h - h), w, h };
    });
  }

  const scale = useMemo(() => {
    const maxW = 560;
    if (!natural.w) return 1;
    return Math.min(1, maxW / natural.w);
  }, [natural.w]);

  function clamp(next: { x: number; y: number; w: number; h: number }) {
    const w = Math.min(Math.max(40, next.w), natural.w);
    const h = Math.min(Math.max(40, next.h), natural.h);
    const x = Math.min(Math.max(0, next.x), natural.w - w);
    const y = Math.min(Math.max(0, next.y), natural.h - h);
    return { x, y, w, h };
  }

  function onPointerDown(event: React.PointerEvent, mode: "move" | "resize") {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = { mode, startX: event.clientX, startY: event.clientY, base: crop };
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!drag.current) return;
    const dx = (event.clientX - drag.current.startX) / scale;
    const dy = (event.clientY - drag.current.startY) / scale;
    const base = drag.current.base;
    if (drag.current.mode === "move") {
      setCrop(clamp({ ...base, x: base.x + dx, y: base.y + dy }));
      return;
    }
    const ratio = aspectValue[aspect];
    let w = base.w + dx;
    let h = ratio ? w / ratio : base.h + dy;
    setCrop(clamp({ ...base, w, h }));
  }

  function onPointerUp(event: React.PointerEvent) {
    drag.current = null;
    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  }

  async function apply() {
    setBusy(true);
    try {
      const outMime = mimeType?.includes("png") ? "image/png" : "image/jpeg";
      const result = await cropImageToDataUrl(src, { x: crop.x, y: crop.y, width: crop.w, height: crop.h }, outMime);
      onApply(result.dataUrl, result.width, result.height);
    } finally {
      setBusy(false);
    }
  }

  if (!natural.w) {
    return <p className="text-sm text-muted">در حال آماده‌سازی تصویر برای برش…</p>;
  }

  const dispW = natural.w * scale;
  const dispH = natural.h * scale;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-muted">نسبت برش</label>
        <Select value={aspect} onChange={(event) => applyAspect(event.target.value as CropAspect)} className="max-w-[10rem]">
          <option value="free">آزاد</option>
          <option value="16:9">۱۶:۹</option>
          <option value="4:3">۴:۳</option>
          <option value="1:1">۱:۱</option>
        </Select>
      </div>
      <div
        ref={wrapRef}
        className="relative mx-auto overflow-hidden rounded-md border border-line bg-ink/5"
        style={{ width: dispW, height: dispH }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <img src={src} alt="" className="block h-full w-full select-none" draggable={false} style={{ width: dispW, height: dispH }} />
        <div
          className="absolute border-2 border-sheet shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
          style={{
            left: crop.x * scale,
            top: crop.y * scale,
            width: crop.w * scale,
            height: crop.h * scale,
            cursor: "move",
          }}
          onPointerDown={(event) => onPointerDown(event, "move")}
        >
          <span
            className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize rounded-tl bg-sheet"
            onPointerDown={(event) => {
              event.stopPropagation();
              onPointerDown(event, "resize");
            }}
          />
        </div>
      </div>
      <p className="text-xs text-muted">ناحیه روشن را بکشید یا گوشه را برای تغییر اندازه بگیرید.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={apply} disabled={busy}>{busy ? "در حال برش…" : "اعمال برش"}</Button>
        <Button type="button" tone="ghost" onClick={onCancel}>انصراف</Button>
      </div>
    </div>
  );
}
