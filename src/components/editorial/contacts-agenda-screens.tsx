"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { agendaVisibleToUser, formatAgendaReminder, reporterName, upcomingAgendaItems } from "@/lib/agenda";
import { formatJalaliDateTime, formatJalaliDayHeader } from "@/lib/jalali";
import { JalaliDateTimeField } from "@/components/jalali-datetime-field";
import { faDate, faNum, norm } from "@/lib/format";
import { uid } from "@/lib/id";
import { pushActivity } from "@/lib/activity";
import { useNewsroom } from "@/lib/store";
import type { OfficialContact, ReporterAgendaItem } from "@/lib/types";
import { blankStory, currentUser, placeStory } from "@/lib/workflow";
import { Button, Empty, Field, Flash, Input, ModulePage, Notice, Select, TextArea } from "../ui";

const emptyContact = (): Omit<OfficialContact, "id"> => ({
  fullName: "",
  organization: "",
  position: "",
  mobile: "",
  officePhone: "",
  email: "",
  editorialNotes: "",
  tags: [],
});

export function OfficialContactsScreen() {
  const { data, update } = useNewsroom();
  const [query, setQuery] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyContact());
  const [flash, setFlash] = useState("");

  const orgs = useMemo(
    () => [...new Set((data.officialContacts ?? []).map((item) => item.organization).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fa")),
    [data.officialContacts],
  );
  const tags = useMemo(
    () => [...new Set((data.officialContacts ?? []).flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b, "fa")),
    [data.officialContacts],
  );

  const filtered = (data.officialContacts ?? []).filter((item) => {
    if (orgFilter !== "all" && item.organization !== orgFilter) return false;
    if (tagFilter !== "all" && !item.tags.includes(tagFilter)) return false;
    if (!query.trim()) return true;
    const hay = norm(`${item.fullName} ${item.organization} ${item.position} ${item.mobile} ${item.email} ${item.tags.join(" ")}`);
    return hay.includes(norm(query));
  });

  function load(item: OfficialContact) {
    setEditingId(item.id);
    setForm({ ...item });
  }

  function reset() {
    setEditingId(null);
    setForm(emptyContact());
  }

  function save() {
    if (!form.fullName.trim() || !form.organization.trim()) {
      setFlash("نام و سازمان الزامی است.");
      return;
    }
    const payload: OfficialContact = {
      id: editingId ?? uid("oc"),
      fullName: form.fullName.trim(),
      organization: form.organization.trim(),
      position: form.position.trim(),
      mobile: form.mobile.trim(),
      officePhone: form.officePhone.trim(),
      email: form.email.trim(),
      editorialNotes: form.editorialNotes.trim(),
      tags: form.tags,
    };
    update((current) => ({
      ...current,
      officialContacts: editingId
        ? current.officialContacts.map((item) => (item.id === editingId ? payload : item))
        : [payload, ...current.officialContacts],
    }));
    setFlash(editingId ? "مخاطب به‌روز شد." : "مخاطب اضافه شد.");
    reset();
  }

  function remove(id: string) {
    update((current) => ({ ...current, officialContacts: current.officialContacts.filter((item) => item.id !== id) }));
    if (editingId === id) reset();
    setFlash("مخاطب حذف شد.");
  }

  return (
    <ModulePage slug="official-contacts">
      <Notice>دفترچه در localStorage ذخیره می‌شود و فقط برای تحریریه است.</Notice>
      <Flash>{flash}</Flash>
      <form
        className="mt-4 grid gap-3 rounded-lg border border-line bg-sheet p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        data-testid="official-contact-form"
      >
        <Field label="نام و نام خانوادگی">
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </Field>
        <Field label="سازمان / دستگاه / نهاد">
          <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
        </Field>
        <Field label="سمت / جایگاه">
          <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
        </Field>
        <Field label="موبایل / تماس مستقیم">
          <Input dir="ltr" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        </Field>
        <Field label="دفتر / منشی">
          <Input dir="ltr" value={form.officePhone} onChange={(e) => setForm({ ...form, officePhone: e.target.value })} />
        </Field>
        <Field label="ایمیل">
          <Input dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="برچسب‌ها (با ویرگول)">
          <Input
            value={form.tags.join("، ")}
            onChange={(e) => setForm({ ...form, tags: e.target.value.split(/[،,]/).map((t) => t.trim()).filter(Boolean) })}
          />
        </Field>
        <Field label="یادداشت تحریریه">
          <TextArea rows={3} value={form.editorialNotes} onChange={(e) => setForm({ ...form, editorialNotes: e.target.value })} />
        </Field>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit">{editingId ? "ذخیره ویرایش" : "افزودن مخاطب"}</Button>
          {editingId ? <Button type="button" tone="ghost" onClick={reset}>انصراف</Button> : null}
        </div>
      </form>
      <section className="mt-6 rounded-xl border-2 border-accent/30 bg-sheet p-4 shadow-sm" aria-label="جستجوی مخاطبین">
        <label className="block text-sm font-bold text-ink">جستجوی فوری در دفترچه</label>
        <p className="mt-1 text-xs text-muted">نام، سازمان، سمت، شماره تماس و برچسب</p>
        <Input
          className="mt-3 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثلاً آموزش و پرورش، مدیرکل، ۰۹۱۲…"
          data-testid="official-contacts-search"
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} aria-label="فیلتر سازمان">
            <option value="all">همه سازمان‌ها</option>
            {orgs.map((org) => (
              <option key={org} value={org}>{org}</option>
            ))}
          </Select>
          <Select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} aria-label="فیلتر برچسب">
            <option value="all">همه برچسب‌ها</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </Select>
        </div>
      </section>
      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-sheet" data-testid="official-contacts-table">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-3 py-2 text-right">نام</th>
              <th className="px-3 py-2 text-right">سازمان</th>
              <th className="px-3 py-2 text-right">سمت</th>
              <th className="px-3 py-2 text-right">تماس</th>
              <th className="px-3 py-2 text-right">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted">مخاطبی پیدا نشد.</td>
              </tr>
            ) : null}
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2 font-medium">{item.fullName}</td>
                <td className="px-3 py-2">{item.organization}</td>
                <td className="px-3 py-2">{item.position}</td>
                <td className="px-3 py-2" dir="ltr">{item.mobile || item.officePhone}</td>
                <td className="px-3 py-2">
                  <Button type="button" tone="ghost" onClick={() => load(item)}>ویرایش</Button>
                  <Button type="button" tone="ghost" onClick={() => remove(item.id)}>حذف</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePage>
  );
}

const emptyAgenda = (reporterUserId: string): Omit<ReporterAgendaItem, "id" | "createdAt" | "updatedAt"> => ({
  title: "",
  reporterUserId,
  startAt: "",
  endAt: "",
  location: "",
  meetingLink: "",
  coordinatorPhone: "",
  officialContactId: "",
  requirements: "",
  done: false,
  linkedStoryId: "",
});

export function ReporterAgendaScreen() {
  const { data, update } = useNewsroom();
  const user = currentUser(data);
  const reporters = data.users.filter((u) => data.roles.find((r) => r.id === u.roleId)?.base === "reporter" && u.active);
  const [flash, setFlash] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(() => emptyAgenda(user?.id ?? reporters[0]?.id ?? ""));

  const visible = useMemo(
    () =>
      (data.reporterAgenda ?? [])
        .filter((item) => user && agendaVisibleToUser(data, item, user))
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [data, user],
  );

  function pickContact(contactId: string) {
    const contact = data.officialContacts.find((item) => item.id === contactId);
    setForm((current) => ({
      ...current,
      officialContactId: contactId,
      coordinatorPhone: contact?.mobile || contact?.officePhone || current.coordinatorPhone,
    }));
  }

  function save() {
    if (!form.title.trim() || !form.startAt) {
      setFlash("عنوان و زمان شروع (شمسی) لازم است.");
      return;
    }
    const ts = new Date().toISOString();
    const endAt = form.endAt || form.startAt;
    const payload: ReporterAgendaItem = {
      id: editingId ?? uid("ag"),
      title: form.title.trim(),
      reporterUserId: form.reporterUserId,
      startAt: form.startAt,
      endAt: endAt,
      location: form.location.trim(),
      meetingLink: form.meetingLink.trim(),
      coordinatorPhone: form.coordinatorPhone.trim(),
      officialContactId: form.officialContactId || undefined,
      requirements: form.requirements.trim(),
      done: form.done,
      linkedStoryId: form.linkedStoryId || undefined,
      createdAt: editingId ? (data.reporterAgenda.find((i) => i.id === editingId)?.createdAt ?? ts) : ts,
      updatedAt: ts,
    };
    update((current) => ({
      ...current,
      reporterAgenda: editingId
        ? current.reporterAgenda.map((item) => (item.id === editingId ? payload : item))
        : [payload, ...current.reporterAgenda],
    }));
    setFlash(editingId ? "برنامه به‌روز شد." : "برنامه ثبت شد.");
    setEditingId(null);
    setForm(emptyAgenda(form.reporterUserId));
  }

  function loadItem(item: ReporterAgendaItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      reporterUserId: item.reporterUserId,
      startAt: item.startAt,
      endAt: item.endAt,
      location: item.location,
      meetingLink: item.meetingLink,
      coordinatorPhone: item.coordinatorPhone,
      officialContactId: item.officialContactId ?? "",
      requirements: item.requirements,
      done: item.done,
      linkedStoryId: item.linkedStoryId ?? "",
    });
  }

  function toggleDone(id: string) {
    update((current) => ({
      ...current,
      reporterAgenda: current.reporterAgenda.map((item) => (item.id === id ? { ...item, done: !item.done, updatedAt: new Date().toISOString() } : item)),
    }));
  }

  function linkStory(item: ReporterAgendaItem) {
    const ts = new Date().toISOString();
    const story = {
      ...blankStory(data),
      id: uid("story"),
      title: `گزارش: ${item.title}`,
      lead: item.requirements || item.location,
      author: reporterName(data, item.reporterUserId),
      status: "draft" as const,
      createdAt: ts,
      updatedAt: ts,
    };
    update((current) => {
      const withStory = placeStory(current, story, { log: `پیش‌نویس از برنامه کاری: ${item.title}` });
      return {
        ...withStory,
        reporterAgenda: withStory.reporterAgenda.map((row) =>
          row.id === item.id ? { ...row, linkedStoryId: story.id, updatedAt: ts } : row,
        ),
      };
    });
    setFlash("پیش‌نویس خبر به کارتابل متصل شد.");
  }

  return (
    <ModulePage slug="agenda">
      <Flash>{flash}</Flash>
      <p className="text-sm font-semibold text-muted" data-testid="agenda-jalali-header">تقویم شمسی — {formatJalaliDayHeader(new Date().toISOString())}</p>
      <form
        className="space-y-3 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        data-testid="agenda-form"
      >
        <Field label="عنوان برنامه">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مصاحبه، نشست خبری، گزارش میدانی…" />
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="خبرنگار">
            <Select value={form.reporterUserId} onChange={(e) => setForm({ ...form, reporterUserId: e.target.value })}>
              {reporters.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="مسئول از دفترچه">
            <Select
              value={form.officialContactId ?? ""}
              onChange={(e) => pickContact(e.target.value)}
            >
              <option value="">—</option>
              {data.officialContacts.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName} · {c.organization}</option>
              ))}
            </Select>
          </Field>
          <JalaliDateTimeField label="شروع (شمسی)" value={form.startAt} onChange={(iso) => setForm({ ...form, startAt: iso })} testId="agenda-start-jalali" />
          <JalaliDateTimeField label="پایان (شمسی)" value={form.endAt} onChange={(iso) => setForm({ ...form, endAt: iso })} testId="agenda-end-jalali" />
          <Field label="مکان">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="لینک جلسه">
            <Input dir="ltr" value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
          </Field>
          <Field label="تلفن هماهنگ‌کننده">
            <Input dir="ltr" value={form.coordinatorPhone} onChange={(e) => setForm({ ...form, coordinatorPhone: e.target.value })} />
          </Field>
        </div>
        <Field label="نیازمندی‌ها (ضبط، عکاس و…)">
          <TextArea rows={2} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
        </Field>
        <Button type="submit">{editingId ? "ذخیره برنامه" : "ثبت برنامه"}</Button>
      </form>
      <ul className="mt-6 space-y-3" data-testid="agenda-list">
        {visible.length === 0 ? <Empty>برنامه‌ای ثبت نشده است.</Empty> : null}
        {visible.map((item) => (
          <li key={item.id} className={`rounded-lg border p-4 ${item.done ? "border-line bg-sand/40 opacity-80" : "border-line bg-sheet"}`}>
            <p className="font-bold">{item.title}</p>
            <p className="mt-1 text-sm text-muted">
              {reporterName(data, item.reporterUserId)} · {formatJalaliDateTime(item.startAt)} · {item.location}
            </p>
            <p className="mt-1 text-xs text-accent">{formatJalaliDayHeader(item.startAt)}</p>
            <p className="mt-2 text-sm">{formatAgendaReminder(item, data)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" tone="ghost" onClick={() => loadItem(item)}>ویرایش</Button>
              <Button type="button" tone="ghost" data-testid="agenda-mark-done" onClick={() => toggleDone(item.id)}>
                {item.done ? "بازگشت به باز" : "انجام شد"}
              </Button>
              {item.linkedStoryId ? (
                <Link href={`/editorial/cartable/${item.linkedStoryId}`} className="rounded-md border border-line px-3 py-2 text-sm">خبر متصل</Link>
              ) : (
                <Button type="button" tone="ghost" data-testid="agenda-link-story" onClick={() => linkStory(item)}>ثبت خبر از جلسه</Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        یادآوری‌های امروز و فردا در{" "}
        <Link href="/" className="text-accent underline">پیشخوان</Link> نمایش داده می‌شود.
      </p>
    </ModulePage>
  );
}

export function DashboardAgendaWidget() {
  const { data, update } = useNewsroom();
  const user = currentUser(data);
  const items = useMemo(() => {
    if (!user) return [];
    const role = data.roles.find((r) => r.id === user.roleId);
    const horizon = 2;
    const list = upcomingAgendaItems(data, { includeDone: false, horizonDays: horizon });
    if (role?.base === "reporter") return list.filter((item) => item.reporterUserId === user.id);
    return list;
  }, [data, user]);

  function markDone(id: string) {
    update((current) =>
      pushActivity(
        {
          ...current,
          reporterAgenda: current.reporterAgenda.map((item) => (item.id === id ? { ...item, done: true, updatedAt: new Date().toISOString() } : item)),
        },
        "برنامه کاری انجام‌شده علامت خورد",
      ),
    );
  }

  function createStory(item: ReporterAgendaItem) {
    const ts = new Date().toISOString();
    const story = {
      ...blankStory(data),
      id: uid("story"),
      title: `گزارش: ${item.title}`,
      lead: item.requirements || item.location,
      author: reporterName(data, item.reporterUserId),
      status: "draft" as const,
      createdAt: ts,
      updatedAt: ts,
    };
    update((current) => {
      const withStory = placeStory(current, story, { log: `پیش‌نویس از یادآوری پیشخوان: ${item.title}` });
      return {
        ...withStory,
        reporterAgenda: withStory.reporterAgenda.map((row) =>
          row.id === item.id ? { ...row, linkedStoryId: story.id, updatedAt: ts } : row,
        ),
      };
    });
  }

  return (
    <section className="rounded-lg border-2 border-accent/30 bg-gradient-to-l from-accent/5 to-sheet p-4" data-testid="dashboard-agenda-reminders">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">برنامه‌ها و مصاحبه‌های پیش‌رو</h2>
        <Link href="/editorial/agenda" className="text-sm text-accent">تقویم کاری</Link>
      </div>
      <p className="mt-1 text-xs text-muted">یادآوری امروز و فردا</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">برنامه نزدیکی ثبت نشده است.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border border-line bg-sheet p-3 text-sm">
              <p className="font-semibold leading-7" data-testid="dashboard-agenda-line">{formatAgendaReminder(item, data)}</p>
              <p className="text-xs text-muted">{reporterName(data, item.reporterUserId)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" tone="ghost" data-testid="dashboard-agenda-done" onClick={() => markDone(item.id)}>انجام شد</Button>
                {item.linkedStoryId ? (
                  <Link href={`/editorial/cartable/${item.linkedStoryId}`} className="rounded-md border border-line px-2 py-1 text-xs">مشاهده خبر</Link>
                ) : (
                  <Button type="button" tone="ghost" data-testid="dashboard-agenda-story" onClick={() => createStory(item)}>ثبت خبر</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
