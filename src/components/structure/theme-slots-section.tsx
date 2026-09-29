"use client";

import { ALL_CATEGORIES, defaultHomepageSlots } from "@/lib/homepage-slots";
import type { HomepageSlots, NewsroomData, TemplateSettings } from "@/lib/types";
import { Field, Input, Select } from "../ui";

const HERO_SOURCES: { id: HomepageSlots["hero"]["source"]; label: string }[] = [
  { id: "pinned", label: "سنجاق / ترتیب صفحه اصلی (homeOrder)" },
  { id: "latest-category", label: "آخرین خبر از دستهٔ مشخص" },
  { id: "latest-all", label: "آخرین خبر از همه دسته‌ها" },
];

const HOT_SORTS: { id: HomepageSlots["hot"]["sort"]; label: string }[] = [
  { id: "views", label: "بیشترین بازدید" },
  { id: "latest", label: "تازه‌ترین" },
  { id: "home-order", label: "ترتیب سنجاق‌شده صفحه" },
];

function CategorySelect({
  categories,
  value,
  disabled,
  onChange,
  allowAll = true,
}: {
  categories: NewsroomData["categories"];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  allowAll?: boolean;
}) {
  return (
    <Select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      {allowAll ? <option value={ALL_CATEGORIES}>همه دسته‌ها</option> : null}
      {categories.map((category) => (
        <option key={category.id} value={category.id}>{category.name}</option>
      ))}
    </Select>
  );
}

export function ThemeSlotsSection({
  form,
  categories,
  allowed,
  onChange,
}: {
  form: TemplateSettings;
  categories: NewsroomData["categories"];
  allowed: boolean;
  onChange: (slots: HomepageSlots) => void;
}) {
  const slots = form.homepageSlots ?? defaultHomepageSlots();
  const showcase = slots.categoryShowcase.categoryIds;
  const paddedShowcase = [...showcase];
  while (paddedShowcase.length < 4) paddedShowcase.push("");

  function patchSlots(partial: Partial<HomepageSlots>) {
    onChange({ ...slots, ...partial });
  }

  return (
    <section className="rounded-lg border border-line bg-sheet p-4">
      <h2 className="text-base font-bold">جایگاه اخبار صفحه اصلی</h2>
      <p className="mt-1 text-sm text-muted">منبع هر بلوک پورتال عمومی را از همین بخش تنظیم کنید.</p>

      <div className="mt-4 space-y-6">
        <div className="rounded-md border border-line/80 bg-paper p-3">
          <h3 className="text-sm font-semibold">خبر اصلی (Hero)</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field label="منبع">
              <Select
                value={slots.hero.source}
                disabled={!allowed}
                onChange={(event) =>
                  patchSlots({ hero: { ...slots.hero, source: event.target.value as HomepageSlots["hero"]["source"] } })
                }
              >
                {HERO_SOURCES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </Select>
            </Field>
            {slots.hero.source === "latest-category" ? (
              <Field label="دسته">
                <CategorySelect
                  categories={categories}
                  value={slots.hero.categoryId}
                  disabled={!allowed}
                  allowAll={false}
                  onChange={(categoryId) => patchSlots({ hero: { ...slots.hero, categoryId } })}
                />
              </Field>
            ) : null}
          </div>
        </div>

        <div className="rounded-md border border-line/80 bg-paper p-3">
          <h3 className="text-sm font-semibold">ستون اخبار ویژه (کنار تیتر اصلی)</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field label="دسته منبع">
              <CategorySelect
                categories={categories}
                value={slots.featuredSide.categoryId}
                disabled={!allowed}
                onChange={(categoryId) => patchSlots({ featuredSide: { ...slots.featuredSide, categoryId } })}
              />
            </Field>
            <Field label="تعداد نمایش">
              <Input
                type="number"
                min={1}
                max={12}
                value={slots.featuredSide.limit}
                disabled={!allowed}
                onChange={(event) =>
                  patchSlots({ featuredSide: { ...slots.featuredSide, limit: Number(event.target.value) || 3 } })
                }
              />
            </Field>
          </div>
        </div>

        <div className="rounded-md border border-line/80 bg-paper p-3">
          <h3 className="text-sm font-semibold">برگزیده‌های تحریریه (شبکه میانی)</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field label="دسته منبع">
              <CategorySelect
                categories={categories}
                value={slots.editorialPicks.categoryId}
                disabled={!allowed}
                onChange={(categoryId) => patchSlots({ editorialPicks: { ...slots.editorialPicks, categoryId } })}
              />
            </Field>
            <Field label="تعداد">
              <Input
                type="number"
                min={1}
                max={12}
                value={slots.editorialPicks.limit}
                disabled={!allowed}
                onChange={(event) =>
                  patchSlots({ editorialPicks: { ...slots.editorialPicks, limit: Number(event.target.value) || 6 } })
                }
              />
            </Field>
          </div>
        </div>

        <div className="rounded-md border border-line/80 bg-paper p-3">
          <h3 className="text-sm font-semibold">بلوک‌های موضوعی (ستون‌های دسته)</h3>
          <Field label="تعداد خبر در هر بلوک">
            <Input
              type="number"
              min={1}
              max={8}
              className="max-w-[8rem]"
              value={slots.categoryShowcase.storiesPerBlock}
              disabled={!allowed}
              onChange={(event) =>
                patchSlots({
                  categoryShowcase: {
                    ...slots.categoryShowcase,
                    storiesPerBlock: Number(event.target.value) || 4,
                  },
                })
              }
            />
          </Field>
          <ol className="mt-3 space-y-2">
            {paddedShowcase.slice(0, 4).map((categoryId, index) => (
              <li key={index} className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
                <span className="text-sm text-muted">بلوک {index + 1}</span>
                <CategorySelect
                  categories={categories}
                  value={categoryId}
                  disabled={!allowed}
                  allowAll={false}
                  onChange={(nextId) => {
                    const ids = [...showcase];
                    while (ids.length <= index) ids.push("");
                    ids[index] = nextId;
                    patchSlots({
                      categoryShowcase: { ...slots.categoryShowcase, categoryIds: ids.filter(Boolean) },
                    });
                  }}
                />
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-md border border-line/80 bg-paper p-3">
          <h3 className="text-sm font-semibold">پربازدیدترین‌ها / داغ‌ترین‌ها</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <Field label="ترتیب">
              <Select
                value={slots.hot.sort}
                disabled={!allowed}
                onChange={(event) =>
                  patchSlots({ hot: { ...slots.hot, sort: event.target.value as HomepageSlots["hot"]["sort"] } })
                }
              >
                {HOT_SORTS.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="فیلتر دسته (اختیاری)">
              <CategorySelect
                categories={categories}
                value={slots.hot.categoryId}
                disabled={!allowed}
                onChange={(categoryId) => patchSlots({ hot: { ...slots.hot, categoryId } })}
              />
            </Field>
            <Field label="تعداد">
              <Input
                type="number"
                min={1}
                max={15}
                value={slots.hot.limit}
                disabled={!allowed}
                onChange={(event) => patchSlots({ hot: { ...slots.hot, limit: Number(event.target.value) || 8 } })}
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-line/80 bg-paper p-3">
            <h3 className="text-sm font-semibold">گزارش‌های تصویری</h3>
            <Field label="تعداد آلبوم">
              <Input
                type="number"
                min={1}
                max={12}
                value={slots.photos.limit}
                disabled={!allowed}
                onChange={(event) => patchSlots({ photos: { ...slots.photos, limit: Number(event.target.value) || 5 } })}
              />
            </Field>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={slots.photos.featuredOnly}
                disabled={!allowed}
                onChange={(event) => patchSlots({ photos: { ...slots.photos, featuredOnly: event.target.checked } })}
              />
              فقط آلبوم‌های ویژه صفحه اصلی
            </label>
          </div>
          <div className="rounded-md border border-line/80 bg-paper p-3">
            <h3 className="text-sm font-semibold">فیلم و صوت</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={slots.multimedia.enabled}
                disabled={!allowed}
                onChange={(event) => patchSlots({ multimedia: { ...slots.multimedia, enabled: event.target.checked } })}
              />
              نمایش بخش چندرسانه‌ای
            </label>
            <Field label="تعداد ویدئو">
              <Input
                type="number"
                min={1}
                max={12}
                value={slots.multimedia.limit}
                disabled={!allowed || !slots.multimedia.enabled}
                onChange={(event) =>
                  patchSlots({ multimedia: { ...slots.multimedia, limit: Number(event.target.value) || 6 } })
                }
              />
            </Field>
          </div>
        </div>
      </div>
    </section>
  );
}
