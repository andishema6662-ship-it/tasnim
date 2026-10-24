"use client";

import Link from "next/link";
import { ALL_CATEGORIES, defaultHomepageSlots } from "@/lib/homepage-slots";
import { emptyRssSlotRef } from "@/lib/portal-slot-items";
import type { Feed, HomepageSlots, NewsroomData, RssSlotRef, TemplateSettings } from "@/lib/types";
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

const TICKER_SOURCES: { id: HomepageSlots["ticker"]["source"]; label: string }[] = [
  { id: "manual", label: "فقط پیام‌های دستی تیکر" },
  { id: "category", label: "آخرین اخبار از دسته" },
  { id: "service", label: "آخرین اخبار یک سرویس (مثلاً فوری)" },
  { id: "tag", label: "اخبار با برچسب مشخص" },
  { id: "rss", label: "منبع بیرونی (RSS / فید)" },
  { id: "mixed", label: "پیام دستی + اخبار داخلی" },
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

function ContentKindSelect({
  value,
  disabled,
  onChange,
}: {
  value: HomepageSlots["hero"]["contentKind"];
  disabled?: boolean;
  onChange: (value: HomepageSlots["hero"]["contentKind"]) => void;
}) {
  return (
    <Select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as HomepageSlots["hero"]["contentKind"])}>
      <option value="internal">اخبار داخلی (کارتابل)</option>
      <option value="rss">منبع بیرونی (RSS / فید خارجی)</option>
    </Select>
  );
}

function RssFeedFields({
  feeds,
  value,
  disabled,
  onChange,
}: {
  feeds: Feed[];
  value: RssSlotRef;
  disabled?: boolean;
  onChange: (value: RssSlotRef) => void;
}) {
  const ref = { ...emptyRssSlotRef(), ...value };
  return (
    <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
      <Field label="فید از فهرست (فیدخوان)">
        <Select
          value={ref.feedId}
          disabled={disabled}
          onChange={(event) => onChange({ ...ref, feedId: event.target.value })}
        >
          <option value="">— انتخاب فید —</option>
          {feeds.map((feed) => (
            <option key={feed.id} value={feed.id}>{feed.title}</option>
          ))}
        </Select>
      </Field>
      <p className="self-end text-xs text-muted sm:col-span-2">
        فیدهای جدید را در{" "}
        <Link href="/admin/template/rss" className="font-semibold text-accent underline">فیدخوان</Link> اضافه کنید یا آدرس مستقیم وارد کنید.
      </p>
      <Field label="نام منبع (مستقیم)">
        <Input
          value={ref.inlineTitle}
          disabled={disabled}
          onChange={(event) => onChange({ ...ref, inlineTitle: event.target.value })}
        />
      </Field>
      <Field label="آدرس RSS (مستقیم)">
        <Input
          dir="ltr"
          value={ref.inlineUrl}
          disabled={disabled}
          onChange={(event) => onChange({ ...ref, inlineUrl: event.target.value })}
        />
      </Field>
    </div>
  );
}

export function ThemeSlotsSection({
  form,
  categories,
  feeds,
  services,
  allowed,
  onChange,
}: {
  form: TemplateSettings;
  categories: NewsroomData["categories"];
  feeds: Feed[];
  services: NewsroomData["services"];
  allowed: boolean;
  onChange: (slots: HomepageSlots) => void;
}) {
  const slots = form.homepageSlots ?? defaultHomepageSlots();
  const blocks = slots.categoryShowcase.blocks;
  const paddedBlocks = [...blocks];
  while (paddedBlocks.length < 4) {
    paddedBlocks.push({ kind: "internal", categoryId: "", rss: emptyRssSlotRef() });
  }

  function patchSlots(partial: Partial<HomepageSlots>) {
    onChange({ ...slots, ...partial });
  }

  return (
    <section className="rounded-lg border border-line bg-sheet p-4">
      <h2 className="text-base font-bold">جایگاه اخبار صفحه اصلی</h2>
      <p className="mt-1 text-sm text-muted">منبع هر بلوک و پیام متحرک پورتال را از همین بخش تنظیم کنید.</p>

      <div className="mt-4 space-y-6">
        <div className="rounded-md border border-line/80 bg-paper p-3">
          <h3 className="text-sm font-semibold">پیام متحرک (نوار فوری)</h3>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={slots.ticker.enabled}
              disabled={!allowed}
              onChange={(event) => patchSlots({ ticker: { ...slots.ticker, enabled: event.target.checked } })}
            />
            نمایش پیام متحرک در صفحه اصلی سایت
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="برچسب نوار">
              <Input
                value={slots.ticker.label}
                disabled={!allowed}
                onChange={(event) => patchSlots({ ticker: { ...slots.ticker, label: event.target.value } })}
              />
            </Field>
            <Field label="منبع محتوا">
              <Select
                value={slots.ticker.source}
                disabled={!allowed}
                onChange={(event) =>
                  patchSlots({ ticker: { ...slots.ticker, source: event.target.value as HomepageSlots["ticker"]["source"] } })
                }
              >
                {TICKER_SOURCES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </Select>
            </Field>
            {slots.ticker.source === "category" || slots.ticker.source === "mixed" ? (
              <Field label="دسته خبر">
                <CategorySelect
                  categories={categories}
                  value={slots.ticker.categoryId}
                  disabled={!allowed}
                  onChange={(categoryId) => patchSlots({ ticker: { ...slots.ticker, categoryId } })}
                />
              </Field>
            ) : null}
            {slots.ticker.source === "service" ? (
              <Field label="سرویس خبری">
                <Select
                  value={slots.ticker.serviceId}
                  disabled={!allowed}
                  onChange={(event) => patchSlots({ ticker: { ...slots.ticker, serviceId: event.target.value } })}
                >
                  <option value="">انتخاب سرویس</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </Select>
              </Field>
            ) : null}
            {slots.ticker.source === "tag" ? (
              <Field label="برچسب">
                <Input
                  value={slots.ticker.tag}
                  disabled={!allowed}
                  onChange={(event) => patchSlots({ ticker: { ...slots.ticker, tag: event.target.value } })}
                />
              </Field>
            ) : null}
            {slots.ticker.source === "rss" ? (
              <RssFeedFields
                feeds={feeds}
                value={slots.ticker.rss}
                disabled={!allowed}
                onChange={(rss) => patchSlots({ ticker: { ...slots.ticker, rss } })}
              />
            ) : null}
            {slots.ticker.source === "mixed" ? (
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={slots.ticker.includeManual}
                  disabled={!allowed}
                  onChange={(event) => patchSlots({ ticker: { ...slots.ticker, includeManual: event.target.checked } })}
                />
                افزودن پیام‌های دستی از «پیام متحرک» ساختاردهی
              </label>
            ) : null}
            <Field label="حداکثر تعداد تیتر">
              <Input
                type="number"
                min={1}
                max={20}
                value={slots.ticker.limit}
                disabled={!allowed}
                onChange={(event) => patchSlots({ ticker: { ...slots.ticker, limit: Number(event.target.value) || 12 } })}
              />
            </Field>
          </div>
        </div>

        <div className="rounded-md border border-line/80 bg-paper p-3">
          <h3 className="text-sm font-semibold">خبر اصلی (Hero)</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field label="نوع منبع">
              <ContentKindSelect
                value={slots.hero.contentKind}
                disabled={!allowed}
                onChange={(contentKind) => patchSlots({ hero: { ...slots.hero, contentKind } })}
              />
            </Field>
            {slots.hero.contentKind === "internal" ? (
              <>
                <Field label="منبع داخلی">
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
              </>
            ) : (
              <RssFeedFields
                feeds={feeds}
                value={slots.hero.rss}
                disabled={!allowed}
                onChange={(rss) => patchSlots({ hero: { ...slots.hero, rss } })}
              />
            )}
          </div>
        </div>

        <div className="rounded-md border border-line/80 bg-paper p-3">
          <h3 className="text-sm font-semibold">ستون اخبار ویژه (کنار تیتر اصلی)</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field label="نوع منبع">
              <ContentKindSelect
                value={slots.featuredSide.contentKind}
                disabled={!allowed}
                onChange={(contentKind) => patchSlots({ featuredSide: { ...slots.featuredSide, contentKind } })}
              />
            </Field>
            {slots.featuredSide.contentKind === "internal" ? (
              <Field label="دسته منبع">
                <CategorySelect
                  categories={categories}
                  value={slots.featuredSide.categoryId}
                  disabled={!allowed}
                  onChange={(categoryId) => patchSlots({ featuredSide: { ...slots.featuredSide, categoryId } })}
                />
              </Field>
            ) : (
              <RssFeedFields
                feeds={feeds}
                value={slots.featuredSide.rss}
                disabled={!allowed}
                onChange={(rss) => patchSlots({ featuredSide: { ...slots.featuredSide, rss } })}
              />
            )}
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
            <Field label="نوع منبع">
              <ContentKindSelect
                value={slots.editorialPicks.contentKind}
                disabled={!allowed}
                onChange={(contentKind) => patchSlots({ editorialPicks: { ...slots.editorialPicks, contentKind } })}
              />
            </Field>
            {slots.editorialPicks.contentKind === "internal" ? (
              <Field label="دسته منبع">
                <CategorySelect
                  categories={categories}
                  value={slots.editorialPicks.categoryId}
                  disabled={!allowed}
                  onChange={(categoryId) => patchSlots({ editorialPicks: { ...slots.editorialPicks, categoryId } })}
                />
              </Field>
            ) : (
              <RssFeedFields
                feeds={feeds}
                value={slots.editorialPicks.rss}
                disabled={!allowed}
                onChange={(rss) => patchSlots({ editorialPicks: { ...slots.editorialPicks, rss } })}
              />
            )}
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
          <ol className="mt-3 space-y-3">
            {paddedBlocks.slice(0, 4).map((block, index) => (
              <li key={index} className="rounded border border-line/60 p-2">
                <p className="text-sm font-medium text-muted">بلوک {index + 1}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Field label="نوع">
                    <Select
                      value={block.kind}
                      disabled={!allowed}
                      onChange={(event) => {
                        const next = [...blocks];
                        while (next.length <= index) next.push({ kind: "internal", categoryId: "", rss: emptyRssSlotRef() });
                        next[index] = { ...next[index], kind: event.target.value as "internal" | "rss" };
                        patchSlots({ categoryShowcase: { ...slots.categoryShowcase, blocks: next } });
                      }}
                    >
                      <option value="internal">دسته داخلی</option>
                      <option value="rss">RSS بیرونی</option>
                    </Select>
                  </Field>
                  {block.kind === "internal" ? (
                    <Field label="دسته">
                      <CategorySelect
                        categories={categories}
                        value={block.categoryId}
                        disabled={!allowed}
                        allowAll={false}
                        onChange={(categoryId) => {
                          const next = [...blocks];
                          while (next.length <= index) next.push({ kind: "internal", categoryId: "", rss: emptyRssSlotRef() });
                          next[index] = { ...next[index], categoryId };
                          patchSlots({ categoryShowcase: { ...slots.categoryShowcase, blocks: next } });
                        }}
                      />
                    </Field>
                  ) : (
                    <RssFeedFields
                      feeds={feeds}
                      value={block.rss}
                      disabled={!allowed}
                      onChange={(rss) => {
                        const next = [...blocks];
                        while (next.length <= index) next.push({ kind: "rss", categoryId: "", rss: emptyRssSlotRef() });
                        next[index] = { ...next[index], kind: "rss", rss };
                        patchSlots({ categoryShowcase: { ...slots.categoryShowcase, blocks: next } });
                      }}
                    />
                  )}
                </div>
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
