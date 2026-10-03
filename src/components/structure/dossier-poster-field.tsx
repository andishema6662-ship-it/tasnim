"use client";

import { useRef, useState } from "react";
import { CoverThumb } from "@/components/cover-thumb";
import { MediaLibraryModal } from "@/components/media/media-library-modal";
import { Button, Field, Flash, Input } from "../ui";

export function DossierPosterField({
  poster,
  onPosterChange,
  testIdPrefix = "dossier",
}: {
  poster: string;
  onPosterChange: (url: string) => void;
  testIdPrefix?: string;
}) {
  const [flash, setFlash] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFlash("فقط فایل تصویر مجاز است.");
      return;
    }
    if (file.size > 3_000_000) {
      setFlash("حجم تصویر زیاد است. کمتر از ۳ مگابایت انتخاب کنید.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onPosterChange(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Field label="بارگذاری تصویر پوستر پرونده">
      <Flash>{flash}</Flash>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid={`${testIdPrefix}-poster-file`}
        onChange={onFile}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" data-testid={`${testIdPrefix}-poster-upload-btn`} onClick={() => fileRef.current?.click()}>
          بارگذاری تصویر پوستر پرونده
        </Button>
        <Button type="button" tone="ghost" data-testid={`${testIdPrefix}-poster-library-btn`} onClick={() => setMediaOpen(true)}>
          انتخاب از کتابخانه رسانه
        </Button>
        {poster && poster !== "sand" ? (
          <Button type="button" tone="quiet" onClick={() => onPosterChange("sand")}>
            حذف تصویر
          </Button>
        ) : null}
      </div>
      <Input
        className="mt-2"
        value={/^https?:/i.test(poster) ? poster : ""}
        onChange={(event) => onPosterChange(event.target.value.trim() || "sand")}
        placeholder="یا آدرس مستقیم تصویر"
        data-testid={`${testIdPrefix}-poster-url`}
      />
      {poster ? (
        <div className="mt-3 max-w-sm" data-testid={`${testIdPrefix}-poster-preview`}>
          <CoverThumb cover={poster} className="h-40 w-full rounded-lg border border-line" />
        </div>
      ) : null}
      <MediaLibraryModal
        open={mediaOpen}
        title="پوستر پرونده ویژه"
        confirmLabel="استفاده به‌عنوان پوستر"
        onClose={() => setMediaOpen(false)}
        onPick={(src) => {
          onPosterChange(src);
          setMediaOpen(false);
        }}
      />
    </Field>
  );
}
