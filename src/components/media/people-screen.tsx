"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PersonHexaCard } from "@/components/people/person-ui";
import { uid } from "@/lib/id";
import { PERSON_KINDS, filterPeople, visiblePeople } from "@/lib/people";
import { useNewsroom } from "@/lib/store";
import type { Person } from "@/lib/types";
import { canPerm, currentRole } from "@/lib/workflow";
import { Button, Empty, Field, Flash, Input, ModulePage, Select, TextArea } from "../ui";

const emptyForm = (): Omit<Person, "id"> => ({
  name: "",
  title: "",
  bio: "",
  kind: "خبرنگار",
  visible: true,
  editorialRank: "",
  joinedAt: new Date().toISOString(),
  avatarUrl: "",
  phone: "",
  email: "",
  desk: "",
});

export function PeopleScreen() {
  const { data, update } = useNewsroom();
  const role = currentRole(data);
  const canManage = canPerm(data, "manageUsers") || role.base === "chief" || role.base === "publisher";
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [flash, setFlash] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [showForm, setShowForm] = useState(false);

  const visible = visiblePeople(data);
  const filtered = useMemo(() => filterPeople(visible, query, kindFilter), [visible, query, kindFilter]);
  const kinds = useMemo(() => [...new Set(data.people.map((p) => p.kind))].sort(), [data.people]);

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function startEdit(person: Person) {
    setEditingId(person.id);
    setForm({
      name: person.name,
      title: person.title,
      bio: person.bio,
      kind: person.kind,
      visible: person.visible,
      editorialRank: person.editorialRank ?? "",
      joinedAt: person.joinedAt ?? new Date().toISOString(),
      avatarUrl: person.avatarUrl ?? "",
      phone: person.phone ?? "",
      email: person.email ?? "",
      desk: person.desk ?? "",
      userId: person.userId,
      reporterTier: person.reporterTier,
      tierNote: person.tierNote,
      interviewCount: person.interviewCount,
    });
    setShowForm(true);
  }

  function savePerson(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    const existing = editingId ? data.people.find((item) => item.id === editingId) : undefined;
    const payload: Person = {
      id: editingId ?? uid("p"),
      name: form.name.trim(),
      title: form.title.trim(),
      bio: form.bio.trim(),
      kind: form.kind,
      visible: true,
      editorialRank: form.editorialRank?.trim() || undefined,
      joinedAt: form.joinedAt,
      avatarUrl: form.avatarUrl?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      desk: form.desk?.trim() || undefined,
      userId: form.userId ?? existing?.userId,
      reporterTier: form.reporterTier ?? existing?.reporterTier,
      tierNote: form.tierNote ?? existing?.tierNote,
      interviewCount: form.interviewCount ?? existing?.interviewCount,
    };
    update((current) => ({
      ...current,
      people: editingId
        ? current.people.map((item) => (item.id === editingId ? payload : item))
        : [...current.people, payload],
    }));
    setShowForm(false);
    setFlash(editingId ? "اطلاعات عضو به‌روز شد." : "عضو جدید به همکاران رسانه‌ای اضافه شد.");
  }

  function deletePerson(id: string) {
    if (!window.confirm("این فرد از فهرست حذف شود؟")) return;
    update((current) => ({ ...current, people: current.people.filter((item) => item.id !== id) }));
    setFlash("فرد حذف شد.");
  }

  return (
    <ModulePage slug="people">
      <header className="mb-5 space-y-3 rounded-2xl border border-line bg-sheet p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-primary">همکاران رسانه‌ای</p>
            <h1 className="text-xl font-bold text-slate-800">همکاران رسانه‌ای و دست‌اندرکاران</h1>
            <p className="mt-1 max-w-2xl text-sm leading-7 text-muted">
              کارت تماس HexaDash برای مدیر مسئول، سردبیر، خبرنگاران و عکاسان — در پنل و{" "}
              <Link href="/site/people" className="font-medium text-primary hover:underline">صفحه عمومی سایت</Link>.
            </p>
          </div>
          {canManage ? (
            <Button type="button" onClick={startAdd} data-testid="people-add-btn">
              افزودن عضو جدید
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجو بر اساس نام"
            aria-label="جستجو بر اساس نام"
            className="sm:max-w-xs"
          />
          <Select value={kindFilter} onChange={(event) => setKindFilter(event.target.value)} className="sm:max-w-[12rem]" aria-label="فیلتر نقش">
            <option value="all">همه نقش‌ها</option>
            {kinds.map((kind) => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
          </Select>
        </div>
      </header>

      <Flash>{flash}</Flash>

      {filtered.length ? (
        <div className="grid gap-x-6 md:grid-cols-2 xl:grid-cols-4" data-testid="people-card-grid">
          {filtered.map((person) => (
            <PersonHexaCard
              key={person.id}
              data={data}
              person={person}
              mode="admin"
              canManage={canManage}
              onEdit={() => startEdit(person)}
              onDelete={() => deletePerson(person.id)}
            />
          ))}
        </div>
      ) : (
        <Empty>عضوی با این فیلتر پیدا نشد.</Empty>
      )}

      {showForm ? (
        <form
          className="mt-6 grid gap-3 rounded-2xl border border-line bg-sheet p-4 shadow-sm md:grid-cols-2"
          onSubmit={savePerson}
          data-testid="people-form"
        >
          <h2 className="md:col-span-2 font-bold">{editingId ? "ویرایش عضو" : "فرد جدید"}</h2>
          <Field label="نام کامل">
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
          <Field label="سمت / عنوان">
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="نقش">
            <Select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}>
              {PERSON_KINDS.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </Select>
          </Field>
          <Field label="رتبه تحریریه (اختیاری)">
            <Input value={form.editorialRank ?? ""} onChange={(event) => setForm({ ...form, editorialRank: event.target.value })} />
          </Field>
          <Field label="تلفن">
            <Input value={form.phone ?? ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} dir="ltr" />
          </Field>
          <Field label="ایمیل">
            <Input value={form.email ?? ""} onChange={(event) => setForm({ ...form, email: event.target.value })} dir="ltr" />
          </Field>
          <Field label="میز / محل">
            <Input value={form.desk ?? ""} onChange={(event) => setForm({ ...form, desk: event.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Field label="معرفی کوتاه">
              <TextArea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={3} />
            </Field>
          </div>
          <Field label="آدرس تصویر (اختیاری)">
            <Input value={form.avatarUrl ?? ""} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} dir="ltr" />
          </Field>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit">ذخیره</Button>
            <Button type="button" tone="ghost" onClick={() => setShowForm(false)}>انصراف</Button>
          </div>
        </form>
      ) : null}
    </ModulePage>
  );
}
