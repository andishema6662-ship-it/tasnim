"use client";

import { useRef, useState } from "react";
import { CoverThumb } from "@/components/cover-thumb";
import { MediaLibraryModal } from "@/components/media/media-library-modal";
import type { PortalBrandingSettings, PortalHeaderBannerSettings, TemplateSettings } from "@/lib/types";
import { Button, Field, Input } from "../ui";

export function ThemeBrandingSection({
  form,
  allowed,
  onPatch,
}: {
  form: TemplateSettings;
  allowed: boolean;
  onPatch: (partial: Partial<Pick<TemplateSettings, "portalBranding" | "portalHeaderBanner">>) => void;
}) {
  const branding = form.portalBranding;
  const banner = form.portalHeaderBanner;
  const [logoModal, setLogoModal] = useState(false);
  const [bannerModal, setBannerModal] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  function patchBranding(partial: Partial<PortalBrandingSettings>) {
    onPatch({ portalBranding: { ...branding, ...partial } });
  }

  function patchBanner(partial: Partial<PortalHeaderBannerSettings>) {
    onPatch({ portalHeaderBanner: { ...banner, ...partial } });
  }

  function pickLogoFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") patchBranding({ brandMark: reader.result });
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <section className="rounded-lg border border-line bg-sheet p-4">
        <h2 className="text-base font-bold">لوگو و آرم رسانه</h2>
        <p className="mt-1 text-sm text-muted">نام و آرم در سرصفحه پورتال عمومی (صفحه اصلی) نمایش داده می‌شود.</p>
        <div className="mt-4 grid max-w-xl gap-3">
          <Field label="نام رسانه">
            <Input
              value={branding.mediaName}
              disabled={!allowed}
              onChange={(event) => patchBranding({ mediaName: event.target.value })}
              placeholder="نام خبرگزاری"
            />
          </Field>
          <Field label="عنوان نمایش داده شده (زیرنام / شعار کوتاه)">
            <Input
              value={branding.mediaDisplayTitle}
              disabled={!allowed}
              onChange={(event) => patchBranding({ mediaDisplayTitle: event.target.value })}
              placeholder="عنوان نمایش در هدر"
            />
          </Field>
          <div>
            <p className="text-sm font-medium">تصویر آرم</p>
            <div className="mt-2 flex flex-wrap items-start gap-4">
              {branding.brandMark ? (
                <img src={branding.brandMark} alt="" className="h-20 w-20 rounded-md border border-line bg-paper object-contain" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-line text-xs text-muted">بدون آرم</div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="button" tone="ghost" disabled={!allowed} onClick={() => setLogoModal(true)}>
                  کتابخانه رسانه
                </Button>
                <Button type="button" tone="ghost" disabled={!allowed} onClick={() => logoFileRef.current?.click()}>
                  بارگذاری از رایانه
                </Button>
                {branding.brandMark ? (
                  <Button type="button" tone="quiet" disabled={!allowed} onClick={() => patchBranding({ brandMark: "" })}>
                    حذف آرم
                  </Button>
                ) : null}
              </div>
            </div>
            <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={pickLogoFile} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-sheet p-4">
        <h2 className="text-base font-bold">بنر هدر سایت (۷۲۸×۹۰)</h2>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={banner.enabled}
            disabled={!allowed}
            onChange={(event) => patchBanner({ enabled: event.target.checked })}
          />
          نمایش بنر بالای جستجو در صفحه اصلی
        </label>
        <div className="mt-4 grid max-w-2xl gap-3">
          <Field label="پیوند بنر (URL)">
            <Input
              dir="ltr"
              value={banner.href}
              disabled={!allowed || !banner.enabled}
              onChange={(event) => patchBanner({ href: event.target.value })}
              placeholder="https://example.com"
            />
          </Field>
          <div>
            <p className="text-sm font-medium">تصویر بنر</p>
            {banner.image ? (
              <CoverThumb cover={banner.image} className="mt-2 h-[90px] w-full max-w-[728px] rounded border border-line" />
            ) : (
              <div className="mt-2 flex h-[90px] max-w-[728px] items-center justify-center rounded border border-dashed border-line text-xs text-muted">
                جایگاه ۷۲۸×۹۰ — تصویری انتخاب نشده (در صورت خالی بودن از اولین تبلیغ فعال استفاده می‌شود)
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" tone="ghost" disabled={!allowed || !banner.enabled} onClick={() => setBannerModal(true)}>
                انتخاب از کتابخانه رسانه
              </Button>
              {banner.image ? (
                <Button type="button" tone="quiet" disabled={!allowed} onClick={() => patchBanner({ image: "" })}>
                  حذف تصویر
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <MediaLibraryModal
        open={logoModal}
        title="انتخاب آرم رسانه"
        confirmLabel="استفاده به‌عنوان آرم"
        onClose={() => setLogoModal(false)}
        onPick={(src) => {
          patchBranding({ brandMark: src });
          setLogoModal(false);
        }}
      />
      <MediaLibraryModal
        open={bannerModal}
        title="انتخاب بنر هدر"
        confirmLabel="استفاده به‌عنوان بنر"
        onClose={() => setBannerModal(false)}
        onPick={(src) => {
          patchBanner({ image: src });
          setBannerModal(false);
        }}
      />
    </>
  );
}
