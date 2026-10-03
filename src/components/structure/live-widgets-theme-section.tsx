"use client";

import { uid } from "@/lib/id";
import { portalWidgetsFromLive } from "@/lib/live-widgets";
import type { LiveWidgetsSettings, TemplateSettings } from "@/lib/types";
import { Button, Field, Input, TextArea } from "../ui";

function WidgetSlotEditor({
  label,
  slot,
  disabled,
  onChange,
  testId,
  showCities,
}: {
  label: string;
  slot: LiveWidgetsSettings["weather"];
  disabled?: boolean;
  onChange: (next: typeof slot) => void;
  testId: string;
  showCities?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-paper p-4" data-testid={testId}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold">{label}</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={slot.enabled}
            disabled={disabled}
            onChange={(event) => onChange({ ...slot, enabled: event.target.checked })}
          />
          فعال
        </label>
      </div>
      <div className="mt-3">
      <Field label="عنوان نمایشی">
        <Input value={slot.title} disabled={disabled} onChange={(event) => onChange({ ...slot, title: event.target.value })} />
      </Field>
      </div>
      {showCities ? (
        <Field label="شهرهای پیش‌فرض (وقتی embed خالی است)">
          <Input
            value={slot.cities ?? ""}
            disabled={disabled}
            onChange={(event) => onChange({ ...slot, cities: event.target.value })}
          />
        </Field>
      ) : null}
      <Field label="کد اسکریپت / HTML ویجت (درج کدهای جاوااسکریپت و آی‌فریم ارائه‌دهنده سرویس)">
        <TextArea
          rows={4}
          dir="ltr"
          className="font-mono text-xs"
          disabled={disabled}
          value={slot.embedCode}
          onChange={(event) => onChange({ ...slot, embedCode: event.target.value })}
          placeholder='<iframe src="..." ...></iframe> یا <script src="..."></script>'
          data-testid={`${testId}-embed`}
        />
      </Field>
    </div>
  );
}

export function LiveWidgetsThemeSection({
  form,
  disabled,
  onForm,
}: {
  form: TemplateSettings;
  disabled?: boolean;
  onForm: (next: TemplateSettings) => void;
}) {
  const live = form.liveWidgets;

  function patchLive(next: LiveWidgetsSettings) {
    onForm({ ...form, liveWidgets: next, portalWidgets: portalWidgetsFromLive(next) });
  }

  return (
    <section className="rounded-lg border border-line bg-sheet p-4" data-testid="theme-live-widgets">
      <h2 className="text-base font-bold">ویجت‌های زنده پورتال</h2>
      <p className="mt-1 text-xs text-muted">
        برای هر بخش کد embed ارائه‌دهنده (tgju، time.ir، varzesh3 و …) را قرار دهید. اگر خالی باشد، نمایش نمونه داخلی استفاده می‌شود.
      </p>
      <div className="mt-4 space-y-4">
        <WidgetSlotEditor
          label="آب و هوا / هواشناسی"
          slot={live.weather}
          disabled={disabled}
          showCities
          testId="live-widget-weather"
          onChange={(weather) => patchLive({ ...live, weather })}
        />
        <WidgetSlotEditor
          label="نرخ طلا و ارز و سکه"
          slot={live.rates}
          disabled={disabled}
          testId="live-widget-rates"
          onChange={(rates) => patchLive({ ...live, rates })}
        />
        <WidgetSlotEditor
          label="جدول و نتایج لیگ فوتبال"
          slot={live.league}
          disabled={disabled}
          testId="live-widget-league"
          onChange={(league) => patchLive({ ...live, league })}
        />
      </div>
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold">ابزارک‌های سفارشی</h3>
          <Button
            type="button"
            tone="ghost"
            className="text-xs"
            disabled={disabled}
            data-testid="live-widget-custom-add"
            onClick={() =>
              patchLive({
                ...live,
                customSlots: [
                  ...live.customSlots,
                  { id: uid("lw"), enabled: true, title: "ویجت سفارشی", embedCode: "" },
                ],
              })
            }
          >
            افزودن ویجت سفارشی
          </Button>
        </div>
        <div className="mt-3 space-y-3">
          {live.customSlots.map((slot, index) => (
            <div key={slot.id} className="rounded-lg border border-dashed border-line bg-paper p-3" data-testid={`live-widget-custom-${slot.id}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted">ویجت #{index + 1}</span>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    disabled={disabled}
                    onChange={(event) =>
                      patchLive({
                        ...live,
                        customSlots: live.customSlots.map((item) =>
                          item.id === slot.id ? { ...item, enabled: event.target.checked } : item,
                        ),
                      })
                    }
                  />
                  فعال
                </label>
                <Button
                  type="button"
                  tone="quiet"
                  className="text-xs"
                  disabled={disabled}
                  onClick={() => patchLive({ ...live, customSlots: live.customSlots.filter((item) => item.id !== slot.id) })}
                >
                  حذف
                </Button>
              </div>
              <Field label="عنوان نمایشی">
                <Input
                  value={slot.title}
                  disabled={disabled}
                  onChange={(event) =>
                    patchLive({
                      ...live,
                      customSlots: live.customSlots.map((item) =>
                        item.id === slot.id ? { ...item, title: event.target.value } : item,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="کد اسکریپت / HTML ویجت">
                <TextArea
                  rows={3}
                  dir="ltr"
                  className="font-mono text-xs"
                  disabled={disabled}
                  value={slot.embedCode}
                  onChange={(event) =>
                    patchLive({
                      ...live,
                      customSlots: live.customSlots.map((item) =>
                        item.id === slot.id ? { ...item, embedCode: event.target.value } : item,
                      ),
                    })
                  }
                />
              </Field>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
