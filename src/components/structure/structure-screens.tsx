"use client";

import { useMemo, useState } from "react";
import { dayKey, faDay, faNum } from "@/lib/format";
import { uid } from "@/lib/id";
import { useNewsroom } from "@/lib/store";
import type { Block } from "@/lib/types";
import { canPerm } from "@/lib/workflow";
import { Button, Empty, Field, Flash, Input, ModulePage, Notice, Select, TextArea } from "../ui";

function useStructure() {
  const store = useNewsroom();
  return { ...store, allowed: canPerm(store.data, "manageStructure") };
}

export function CategoriesScreen() {
  const { data, update, allowed } = useStructure();
  const [form, setForm] = useState({ name: "", description: "" });
  const [flash, setFlash] = useState("");

  return (
    <ModulePage slug="categories">
      {!allowed ? <Notice>افزودن و حذف دسته با سردبیر یا مدیر مسئول است. خبرنگار از دسته‌های موجود در کارتابل استفاده می‌کند.</Notice> : null}
      <Flash>{flash}</Flash>
      <form
        className="grid gap-3 rounded-lg border border-line bg-sheet p-4 md:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (!allowed || !form.name.trim()) return;
          const id = uid("cat");
          update((current) => ({
            ...current,
            categories: [...current.categories, { id, name: form.name.trim(), description: form.description.trim() }],
            access: [
              ...current.access,
              ...current.roles.map((role) => ({
                roleId: role.id,
                categoryId: id,
                edit: true,
                publish: role.base !== "reporter",
              })),
            ],
          }));
          setForm({ name: "", description: "" });
          setFlash("دسته اضافه شد.");
        }}
      >
        <Field label="نام">
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="توضیح">
          <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </Field>
        <Button type="submit" disabled={!allowed} className="self-end">
          افزودن دسته
        </Button>
      </form>
      <div className="space-y-2">
        {data.categories.map((category) => {
          const count = data.stories.filter((story) => story.categoryId === category.id).length;
          return (
            <article key={category.id} className="grid gap-2 rounded-lg border border-line bg-sheet p-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
              <Input
                value={category.name}
                disabled={!allowed}
                aria-label="نام دسته"
                onChange={(event) => {
                  const name = event.target.value;
                  update((current) => ({ ...current, categories: current.categories.map((item) => (item.id === category.id ? { ...item, name } : item)) }));
                }}
              />
              <Input
                value={category.description}
                disabled={!allowed}
                aria-label="توضیح دسته"
                onChange={(event) => {
                  const description = event.target.value;
                  update((current) => ({ ...current, categories: current.categories.map((item) => (item.id === category.id ? { ...item, description } : item)) }));
                }}
              />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">{faNum(count)} خبر</span>
                <Button
                  tone="quiet"
                  disabled={!allowed || count > 0}
                  onClick={() => {
                    update((current) => ({ ...current, categories: current.categories.filter((item) => item.id !== category.id) }));
                    setFlash(count > 0 ? "دسته خبر دارد." : "دسته حذف شد.");
                  }}
                >
                  حذف
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </ModulePage>
  );
}

export function ServicesScreen() {
  const { data, update, allowed } = useStructure();
  const [form, setForm] = useState({ name: "", description: "" });
  const [flash, setFlash] = useState("");

  return (
    <ModulePage slug="services">
      {!allowed ? <Notice>ساخت سرویس با سردبیر یا مدیر مسئول است.</Notice> : null}
      <Flash>{flash}</Flash>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!allowed || !form.name.trim()) return;
          update((current) => ({
            ...current,
            services: [...current.services, { id: uid("srv"), name: form.name.trim(), description: form.description.trim(), active: true }],
          }));
          setForm({ name: "", description: "" });
          setFlash("سرویس اضافه شد.");
        }}
      >
        <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="نام سرویس" />
        <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="توضیح" />
        <Button type="submit" disabled={!allowed}>
          افزودن سرویس
        </Button>
      </form>
      {data.services.map((service) => {
        const count = data.stories.filter((story) => story.serviceId === service.id).length;
        return (
          <article key={service.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-sheet px-4 py-3">
            <div>
              <h2 className="font-semibold">{service.name}</h2>
              <p className="text-sm text-muted">{service.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">{faNum(count)} خبر</span>
              <Button
                tone="ghost"
                disabled={!allowed}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    services: current.services.map((item) => (item.id === service.id ? { ...item, active: !item.active } : item)),
                  }))
                }
              >
                {service.active ? "فعال" : "خاموش"}
              </Button>
            </div>
          </article>
        );
      })}
    </ModulePage>
  );
}

export function PagesScreen() {
  const { data, update, allowed } = useStructure();
  const [pageId, setPageId] = useState(data.pages[0]?.id ?? "");
  const [name, setName] = useState("");
  const page = data.pages.find((item) => item.id === pageId) ?? data.pages[0];

  function mutate(blocks: Block[]) {
    if (!page) return;
    update((current) => ({
      ...current,
      pages: current.pages.map((item) => (item.id === page.id ? { ...item, blocks } : item)),
    }));
  }

  return (
    <ModulePage slug="pages">
      {!allowed ? <Notice>چیدن صفحه با سردبیر یا مدیر مسئول است.</Notice> : null}
      <div className="flex flex-wrap gap-2">
        <Select value={page?.id ?? ""} onChange={(event) => setPageId(event.target.value)} aria-label="صفحه">
          {data.pages.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </Select>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="نام صفحه تازه" className="max-w-xs" />
        <Button
          disabled={!allowed}
          onClick={() => {
            if (!name.trim()) return;
            const id = uid("page");
            update((current) => ({ ...current, pages: [...current.pages, { id, title: name.trim(), blocks: [] }] }));
            setPageId(id);
            setName("");
          }}
        >
          صفحه تازه
        </Button>
      </div>
      {page ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button tone="ghost" disabled={!allowed} onClick={() => mutate([...page.blocks, { id: uid("b"), type: "heading", text: "تیتر", storyId: "" }])}>
                بلوک تیتر
              </Button>
              <Button tone="ghost" disabled={!allowed} onClick={() => mutate([...page.blocks, { id: uid("b"), type: "text", text: "", storyId: "" }])}>
                بلوک متن
              </Button>
              <Button
                tone="ghost"
                disabled={!allowed}
                onClick={() => mutate([...page.blocks, { id: uid("b"), type: "story", text: "", storyId: data.stories[0]?.id ?? "" }])}
              >
                بلوک خبر
              </Button>
            </div>
            {page.blocks.length === 0 ? <Empty>بلوکی چیده نشده است.</Empty> : null}
            {page.blocks.map((block, index) => (
              <div key={block.id} className="rounded-lg border border-line bg-sheet p-3">
                <div className="mb-2 flex justify-between text-xs text-muted">
                  <span>{block.type === "heading" ? "تیتر" : block.type === "text" ? "متن" : "خبر"}</span>
                  <span className="flex gap-2">
                    <button type="button" disabled={!allowed || index === 0} onClick={() => {
                      const blocks = page.blocks.slice();
                      const [item] = blocks.splice(index, 1);
                      blocks.splice(index - 1, 0, item);
                      mutate(blocks);
                    }}>بالا</button>
                    <button type="button" disabled={!allowed} onClick={() => mutate(page.blocks.filter((item) => item.id !== block.id))}>حذف</button>
                  </span>
                </div>
                {block.type === "story" ? (
                  <Select
                    disabled={!allowed}
                    value={block.storyId}
                    onChange={(event) => mutate(page.blocks.map((item) => (item.id === block.id ? { ...item, storyId: event.target.value } : item)))}
                  >
                    {data.stories.map((story) => (
                      <option key={story.id} value={story.id}>
                        {story.title}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <TextArea
                    disabled={!allowed}
                    value={block.text}
                    onChange={(event) => mutate(page.blocks.map((item) => (item.id === block.id ? { ...item, text: event.target.value } : item)))}
                  />
                )}
              </div>
            ))}
          </div>
          <article className="rounded-lg border border-line bg-sheet p-5">
            <p className="text-xs text-muted">پیش‌نمایش</p>
            <h2 className="text-xl font-bold">{page.title}</h2>
            <div className="mt-4 space-y-3">
              {page.blocks.map((block) => {
                if (block.type === "heading") return <h3 key={block.id} className="text-lg font-bold">{block.text}</h3>;
                if (block.type === "text") return <p key={block.id} className="text-sm leading-7">{block.text}</p>;
                const story = data.stories.find((item) => item.id === block.storyId);
                return (
                  <blockquote key={block.id} className="border-r-2 border-rule pr-3">
                    <p className="font-semibold">{story?.title ?? "خبری انتخاب نشده"}</p>
                    <p className="text-sm text-muted">{story?.lead}</p>
                  </blockquote>
                );
              })}
            </div>
          </article>
        </div>
      ) : (
        <Empty>صفحه‌ای نیست.</Empty>
      )}
    </ModulePage>
  );
}

export function TablesScreen() {
  const { data, update, allowed } = useStructure();
  const [tableId, setTableId] = useState(data.tables[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const table = data.tables.find((item) => item.id === tableId) ?? data.tables[0];

  function save(next: NonNullable<typeof table>) {
    update((current) => ({ ...current, tables: current.tables.map((item) => (item.id === next.id ? next : item)) }));
  }

  return (
    <ModulePage slug="tables">
      {!allowed ? <Notice>ویرایش جدول با سردبیر یا مدیر مسئول است.</Notice> : null}
      <div className="flex flex-wrap gap-2">
        <Select value={table?.id ?? ""} onChange={(event) => setTableId(event.target.value)}>
          {data.tables.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </Select>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="جدول تازه" className="max-w-xs" />
        <Button
          disabled={!allowed}
          onClick={() => {
            if (!title.trim()) return;
            const id = uid("tbl");
            update((current) => ({ ...current, tables: [...current.tables, { id, title: title.trim(), columns: ["ستون"], rows: [[""]] }] }));
            setTableId(id);
            setTitle("");
          }}
        >
          جدول تازه
        </Button>
      </div>
      {table ? (
        <div className="space-y-3 overflow-x-auto rounded-lg border border-line bg-sheet p-3">
          <div className="flex gap-2">
            <Button tone="ghost" disabled={!allowed} onClick={() => save({ ...table, columns: [...table.columns, "ستون"], rows: table.rows.map((row) => [...row, ""]) })}>
              ستون
            </Button>
            <Button tone="ghost" disabled={!allowed} onClick={() => save({ ...table, rows: [...table.rows, table.columns.map(() => "")] })}>
              ردیف
            </Button>
          </div>
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr>
                {table.columns.map((column, index) => (
                  <th key={`${table.id}-c-${index}`} className="p-1">
                    <Input
                      disabled={!allowed}
                      value={column}
                      aria-label="نام ستون"
                      onChange={(event) => {
                        const columns = table.columns.slice();
                        columns[index] = event.target.value;
                        save({ ...table, columns });
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={`${table.id}-r-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${table.id}-${rowIndex}-${cellIndex}`} className="p-1">
                      <Input
                        disabled={!allowed}
                        value={cell}
                        aria-label="خانه جدول"
                        onChange={(event) => {
                          const rows = table.rows.map((line) => line.slice());
                          rows[rowIndex][cellIndex] = event.target.value;
                          save({ ...table, rows });
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>جدولی نیست.</Empty>
      )}
    </ModulePage>
  );
}

export function BannersScreen() {
  const { data, update, allowed } = useStructure();
  const [form, setForm] = useState({ title: "", text: "", href: "", placement: "بالای صفحه" });
  const [flash, setFlash] = useState("");

  return (
    <ModulePage slug="banners">
      <Flash>{flash}</Flash>
      <form
        className="grid gap-3 rounded-lg border border-line bg-sheet p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!allowed || !form.title.trim()) return;
          update((current) => ({ ...current, banners: [{ id: uid("bn"), ...form, title: form.title.trim(), active: true }, ...current.banners] }));
          setForm({ title: "", text: "", href: "", placement: form.placement });
          setFlash("اعلان اضافه شد.");
        }}
      >
        <Field label="عنوان">
          <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </Field>
        <Field label="جایگاه">
          <Select value={form.placement} onChange={(event) => setForm({ ...form, placement: event.target.value })}>
            {["بالای صفحه", "ستون", "میان‌متن"].map((place) => (
              <option key={place}>{place}</option>
            ))}
          </Select>
        </Field>
        <Field label="متن">
          <Input value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} />
        </Field>
        <Field label="پیوند">
          <Input value={form.href} onChange={(event) => setForm({ ...form, href: event.target.value })} dir="ltr" />
        </Field>
        <Button type="submit" disabled={!allowed}>
          افزودن اعلان
        </Button>
      </form>
      {data.banners.map((banner) => (
        <article key={banner.id} className={`rounded-lg border px-4 py-3 ${banner.active ? "border-rule bg-sheet" : "border-line bg-sheet"}`}>
          <p className="text-xs text-muted">{banner.placement}</p>
          <h2 className="font-bold">{banner.title}</h2>
          <p className="text-sm">{banner.text}</p>
          <Button
            tone="ghost"
            className="mt-2"
            disabled={!allowed}
            onClick={() =>
              update((current) => ({
                ...current,
                banners: current.banners.map((item) => (item.id === banner.id ? { ...item, active: !item.active } : item)),
              }))
            }
          >
            {banner.active ? "خاموش" : "روشن"}
          </Button>
        </article>
      ))}
    </ModulePage>
  );
}

export function TickerScreen() {
  const { data, update, allowed } = useStructure();
  const [text, setText] = useState("");
  const active = data.tickers.filter((item) => item.active);

  return (
    <ModulePage slug="ticker">
      <div className="overflow-hidden rounded-md border border-line bg-mast py-2 text-paper">
        <div className="ticker-track px-6 text-sm">{active.map((item) => item.text).join("  ·  ") || "پیام فعالی نیست"}</div>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!allowed || !text.trim()) return;
          update((current) => ({ ...current, tickers: [{ id: uid("tk"), text: text.trim(), active: true }, ...current.tickers] }));
          setText("");
        }}
      >
        <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="متن پیام" />
        <Button type="submit" disabled={!allowed}>
          افزودن
        </Button>
      </form>
      {!allowed ? <Notice>افزودن پیام با سردبیر یا مدیر مسئول است.</Notice> : null}
      <ul className="space-y-2">
        {data.tickers.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-sheet px-4 py-2">
            <span className="text-sm">{item.text}</span>
            <Button
              tone="ghost"
              disabled={!allowed}
              onClick={() =>
                update((current) => ({
                  ...current,
                  tickers: current.tickers.map((ticker) => (ticker.id === item.id ? { ...ticker, active: !ticker.active } : ticker)),
                }))
              }
            >
              {item.active ? "روشن" : "خاموش"}
            </Button>
          </li>
        ))}
      </ul>
    </ModulePage>
  );
}

export function CalendarScreen() {
  const { data, update, allowed } = useStructure();
  const [form, setForm] = useState({ title: "", date: dayKey(), place: "", note: "" });
  const [flash, setFlash] = useState("");
  const days = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = dayKey(date);
      return { key, count: data.events.filter((event) => event.date === key).length };
    });
  }, [data.events]);
  const events = [...data.events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ModulePage slug="calendar">
      <Flash>{flash}</Flash>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <button key={day.key} type="button" className="rounded-md border border-line bg-sheet px-1 py-2 text-center text-[11px]" onClick={() => setForm({ ...form, date: day.key })}>
            <span className="block">{faDay(day.key).split(" ").slice(0, 2).join(" ")}</span>
            <span className="text-rule">{day.count ? faNum(day.count) : ""}</span>
          </button>
        ))}
      </div>
      <form
        className="grid gap-3 rounded-lg border border-line bg-sheet p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!allowed || !form.title.trim()) return;
          update((current) => ({ ...current, events: [...current.events, { id: uid("ev"), ...form, title: form.title.trim() }] }));
          setForm({ title: "", date: form.date, place: "", note: "" });
          setFlash("رویداد ثبت شد.");
        }}
      >
        <Field label="عنوان">
          <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </Field>
        <Field label="تاریخ">
          <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} dir="ltr" />
        </Field>
        <Field label="مکان">
          <Input value={form.place} onChange={(event) => setForm({ ...form, place: event.target.value })} />
        </Field>
        <Field label="یادداشت">
          <Input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </Field>
        <Button type="submit" disabled={!allowed}>
          ثبت رویداد
        </Button>
      </form>
      {!allowed ? <Notice>ثبت رویداد با سردبیر یا مدیر مسئول است.</Notice> : null}
      <ol className="space-y-2">
        {events.map((event) => (
          <li key={event.id} className="rounded-lg border border-line bg-sheet px-4 py-3">
            <p className="text-xs text-rule">{faDay(event.date)}</p>
            <h2 className="font-bold">{event.title}</h2>
            <p className="text-sm text-muted">
              {event.place} {event.note ? `· ${event.note}` : ""}
            </p>
          </li>
        ))}
      </ol>
    </ModulePage>
  );
}
