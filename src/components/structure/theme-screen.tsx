"use client";

import { useState } from "react";
import {
  defaultTemplateSettings,
  FONT_OPTIONS,
  HOME_LAYOUT_OPTIONS,
  PALETTE_OPTIONS,
  resolveTemplateSettings,
} from "@/lib/template";
import type { TemplateSettings } from "@/lib/types";
import { useNewsroom } from "@/lib/store";
import { canPerm } from "@/lib/workflow";
import { Button, Field, Flash, Input, ModulePage, Notice, Select, TextArea } from "../ui";
import { LiveWidgetsThemeSection } from "./live-widgets-theme-section";
import { ThemeBrandingSection } from "./theme-branding-section";
import { ThemeSlotsSection } from "./theme-slots-section";
import { portalWidgetsFromLive } from "@/lib/live-widgets";

export function ThemeScreen() {
  const { data, update } = useNewsroom();
  const allowed = canPerm(data, "manageStructure");
  const resolved = resolveTemplateSettings(data);
  const [form, setForm] = useState<TemplateSettings>(resolved);
  const [flash, setFlash] = useState("");

  function patch(partial: Partial<TemplateSettings>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  return (
    <ModulePage slug="theme">
      <p className="mb-4 text-sm text-muted">
        تغییرات پس از ذخیره در{" "}
        <a href="/site" target="_blank" rel="noreferrer" className="font-semibold text-accent underline">
          پورتال عمومی (/site)
        </a>{" "}
        با بارگذاری مجدد صفحه اعمال می‌شود.
      </p>
      {!allowed ? (
        <Notice>ویرایش قالب و تنظیمات پورتال با سردبیر یا مدیر مسئول است.</Notice>
      ) : null}
      <Flash>{flash}</Flash>
      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (!allowed) return;
          update((current) => ({
            ...current,
            settings: {
              ...current.settings,
              mediaName: form.portalBranding.mediaName.trim(),
              mediaDisplayTitle: form.portalBranding.mediaDisplayTitle.trim(),
              brandMark: form.portalBranding.brandMark,
            },
            templateSettings: {
              ...form,
              liveWidgets: form.liveWidgets,
              portalWidgets: portalWidgetsFromLive(form.liveWidgets),
              showBreakingTicker: form.homepageSlots.ticker.enabled,
              tickerLabel: form.homepageSlots.ticker.label.trim() || "فوری",
              aboutFooter: form.aboutFooter.trim(),
              copyrightText: form.copyrightText.trim() || "تمام حقوق محفوظ است.",
            },
          }));
          setFlash("تنظیمات قالب ذخیره شد. پورتال عمومی را بازخوانی کنید.");
        }}
      >
        <ThemeBrandingSection
          form={form}
          allowed={allowed}
          onPatch={(partial) => patch(partial)}
        />

        <section className="rounded-lg border border-line bg-sheet p-4">
          <h2 className="text-base font-bold">رنگ اصلی و سازمانی</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PALETTE_OPTIONS.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${form.palette === item.id ? "border-accent ring-1 ring-accent" : "border-line"}`}
              >
                <input
                  type="radio"
                  name="palette"
                  className="sr-only"
                  checked={form.palette === item.id}
                  disabled={!allowed}
                  onChange={() => patch({ palette: item.id })}
                />
                <span className="flex gap-1">
                  <span className="h-8 w-8 rounded" style={{ background: item.primary }} />
                  <span className="h-8 w-8 rounded" style={{ background: item.accent }} />
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </label>
            ))}
          </div>
          {form.palette === "custom" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="رنگ اصلی (hex)">
                <Input
                  dir="ltr"
                  value={form.customPrimary}
                  disabled={!allowed}
                  onChange={(event) => patch({ customPrimary: event.target.value })}
                />
              </Field>
              <Field label="رنگ تأکید (hex)">
                <Input
                  dir="ltr"
                  value={form.customAccent}
                  disabled={!allowed}
                  onChange={(event) => patch({ customAccent: event.target.value })}
                />
              </Field>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-line bg-sheet p-4">
          <h2 className="text-base font-bold">چیدمان صفحه اصلی</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {HOME_LAYOUT_OPTIONS.map((item) => (
              <label
                key={item.id}
                className={`cursor-pointer rounded-lg border p-3 text-sm ${form.homeLayout === item.id ? "border-accent bg-paper" : "border-line"}`}
              >
                <input
                  type="radio"
                  name="homeLayout"
                  className="mr-2"
                  checked={form.homeLayout === item.id}
                  disabled={!allowed}
                  onChange={() => patch({ homeLayout: item.id })}
                />
                {item.label}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-sheet p-4">
          <h2 className="text-base font-bold">تنظیمات هدر</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.showTriCalendar}
                  disabled={!allowed}
                  onChange={(event) => patch({ showTriCalendar: event.target.checked })}
                />
                نمایش تاریخ سه‌گانه
              </label>
            </li>
            <li>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.showLiveClock}
                  disabled={!allowed}
                  onChange={(event) => patch({ showLiveClock: event.target.checked })}
                />
                ساعت زنده
              </label>
            </li>
            <li>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.showLanguageToggle}
                  disabled={!allowed}
                  onChange={(event) => patch({ showLanguageToggle: event.target.checked })}
                />
                دکمه زبان
              </label>
            </li>
          </ul>
          <p className="mt-2 text-xs text-muted">تنظیم پیام متحرک و منبع آن در بخش «جایگاه اخبار صفحه اصلی» پایین‌تر است.</p>
        </section>

        <section className="rounded-lg border border-line bg-sheet p-4">
          <h2 className="text-base font-bold">سایدبار و فوتر</h2>
          <div className="mt-3 space-y-3">
            <Field label="متن درباره خبرگزاری (فوتر)">
              <TextArea
                rows={3}
                value={form.aboutFooter}
                disabled={!allowed}
                onChange={(event) => patch({ aboutFooter: event.target.value })}
              />
            </Field>
            <Field label="حق نشر و کپی‌رایت">
              <Input
                value={form.copyrightText}
                disabled={!allowed}
                onChange={(event) => patch({ copyrightText: event.target.value })}
              />
            </Field>
            <Field label="تلگرام">
              <Input dir="ltr" value={form.socialTelegram} disabled={!allowed} onChange={(event) => patch({ socialTelegram: event.target.value })} />
            </Field>
            <Field label="اینستاگرام">
              <Input dir="ltr" value={form.socialInstagram} disabled={!allowed} onChange={(event) => patch({ socialInstagram: event.target.value })} />
            </Field>
            <Field label="یوتیوب">
              <Input dir="ltr" value={form.socialYoutube} disabled={!allowed} onChange={(event) => patch({ socialYoutube: event.target.value })} />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-sheet p-4">
          <h2 className="text-base font-bold">مجوز وزارت فرهنگ و ارشاد اسلامی</h2>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.ershadLicense.enabled}
              disabled={!allowed}
              onChange={(event) => patch({ ershadLicense: { ...form.ershadLicense, enabled: event.target.checked } })}
            />
            نمایش در فوتر سایت عمومی
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="شماره / کد مجوز">
              <Input
                value={form.ershadLicense.code}
                disabled={!allowed}
                onChange={(event) => patch({ ershadLicense: { ...form.ershadLicense, code: event.target.value } })}
                data-testid="theme-ershad-code"
              />
            </Field>
            <Field label="آدرس تصویر نماد (اختیاری)">
              <Input
                dir="ltr"
                value={form.ershadLicense.badgeImage}
                disabled={!allowed}
                onChange={(event) => patch({ ershadLicense: { ...form.ershadLicense, badgeImage: event.target.value } })}
              />
            </Field>
          </div>
        </section>

        <LiveWidgetsThemeSection form={form} disabled={!allowed} onForm={setForm} />

        <ThemeSlotsSection
          form={form}
          categories={data.categories}
          feeds={data.feeds}
          services={data.services}
          allowed={allowed}
          onChange={(homepageSlots) => patch({ homepageSlots })}
        />

        <section className="rounded-lg border border-line bg-sheet p-4">
          <h2 className="text-base font-bold">تایپوگرافی</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="خانواده قلم">
              <Select
                value={form.fontFamily}
                disabled={!allowed}
                onChange={(event) => patch({ fontFamily: event.target.value as TemplateSettings["fontFamily"] })}
              >
                {FONT_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="اندازه قلم">
              <Select
                value={form.fontScale}
                disabled={!allowed}
                onChange={(event) => patch({ fontScale: event.target.value as TemplateSettings["fontScale"] })}
              >
                <option value="sm">کوچک</option>
                <option value="md">متوسط</option>
                <option value="lg">بزرگ</option>
              </Select>
            </Field>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={!allowed}>ذخیره تنظیمات</Button>
          <Button
            type="button"
            tone="ghost"
            disabled={!allowed}
            onClick={() => {
              const defaults = defaultTemplateSettings();
              setForm(defaults);
              update((current) => ({ ...current, templateSettings: defaults }));
              setFlash("تنظیمات به پیش‌فرض بازنشانی شد.");
            }}
          >
            بازنشانی به پیش‌فرض
          </Button>
        </div>
      </form>
    </ModulePage>
  );
}
