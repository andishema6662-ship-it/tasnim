"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { faDate, faDay, faNum } from "@/lib/format";
import {
  interviewCountForPerson,
  personEditorialRank,
  publishedCountForPerson,
  reporterTierStars,
  workedCountForPerson,
} from "@/lib/people";
import type { NewsroomData, Person } from "@/lib/types";
import { Button, cn } from "../ui";

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" d="M6.5 4h3l1.5 4-2 1.2a12 12 0 0 0 5.3 5.3L15.5 13l4 1.5v3a1.5 1.5 0 0 1-1.4 1.5 16 16 0 0 1-14.9-9.1A1.5 1.5 0 0 1 6.5 4z" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path strokeLinecap="round" d="m3 7 9 6 9-6" />
    </svg>
  );
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path strokeLinecap="round" d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconDots({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

export function PersonAvatar({ person, className }: { person: Person; className?: string }) {
  if (person.avatarUrl) {
    return (
      <img
        src={person.avatarUrl}
        alt=""
        className={cn(
          "h-[90px] w-[90px] shrink-0 rounded-full object-cover shadow-sm ring-4 ring-violet-50",
          className,
        )}
      />
    );
  }
  const initial = person.name.trim().slice(0, 1) || "؟";
  return (
    <div
      className={cn(
        "flex h-[90px] w-[90px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-50 text-3xl font-bold text-violet-700 shadow-sm ring-4 ring-violet-50",
        className,
      )}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

export function PersonStats({ data, person }: { data: NewsroomData; person: Person }) {
  const published = publishedCountForPerson(data, person);
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
      <li>
        <span className="font-semibold text-slate-700">{faNum(published)}</span> اخبار منتشرشده
      </li>
      <li>
        رتبه: <span className="font-medium text-slate-700">{personEditorialRank(person)}</span>
      </li>
      <li>
        عضویت: <span className="font-medium text-slate-700">{person.joinedAt ? faDay(person.joinedAt) : "—"}</span>
      </li>
    </ul>
  );
}

type PersonCardProps = {
  data: NewsroomData;
  person: Person;
  mode: "admin" | "portal";
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

function CardActionMenu({
  person,
  mode,
  canManage,
  onEdit,
  onDelete,
}: {
  person: Person;
  mode: "admin" | "portal";
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const profileHref = mode === "portal" ? `/site/people/${person.id}` : `/people/${person.id}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        aria-label="منوی عملیات"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        data-testid="person-card-menu"
      >
        <IconDots className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-10 mt-1 min-w-[10.5rem] rounded-lg border border-line bg-sheet py-1 shadow-lg">
          <Link href={profileHref} className="block px-3 py-2 text-sm hover:bg-sand" onClick={() => setOpen(false)}>
            نمایش پروفایل
          </Link>
          {canManage && onEdit ? (
            <button type="button" className="block w-full px-3 py-2 text-right text-sm hover:bg-sand" onClick={() => { onEdit(); setOpen(false); }}>
              ویرایش
            </button>
          ) : null}
          {canManage && onDelete ? (
            <button type="button" className="block w-full px-3 py-2 text-right text-sm text-red-700 hover:bg-red-50" onClick={() => { onDelete(); setOpen(false); }}>
              حذف
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PersonHexaCard({ data, person, mode, canManage, onEdit, onDelete }: PersonCardProps) {
  const profileHref = mode === "portal" ? `/site/people/${person.id}` : `/people/${person.id}`;
  const phone = person.phone?.trim();
  const email = person.email?.trim();
  const desk = person.desk?.trim();

  return (
    <article
      className="mb-6 flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
      data-testid="person-card"
    >
      <div className="flex justify-end px-4 pt-3">
        <CardActionMenu person={person} mode={mode} canManage={canManage} onEdit={onEdit} onDelete={onDelete} />
      </div>
      <div className="flex flex-col items-center px-4 pb-4 text-center">
        <PersonAvatar person={person} />
        <h2 className="mt-4 text-base font-bold text-slate-800">{person.name}</h2>
        <span className="mt-2 inline-flex rounded-full bg-violet-50 px-3 py-0.5 text-xs font-semibold text-violet-700">
          {person.title || person.kind}
        </span>
      </div>
      <div className="mt-auto border-t border-slate-100 px-4 py-4">
        <ul className="flex items-center justify-center gap-4 text-slate-500">
          <li>
            {phone ? (
              <a href={`tel:${phone}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 hover:bg-violet-50 hover:text-violet-600" title={phone}>
                <IconPhone className="h-4 w-4" />
              </a>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 opacity-40" title="بدون تلفن">
                <IconPhone className="h-4 w-4" />
              </span>
            )}
          </li>
          <li>
            {email ? (
              <a href={`mailto:${email}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 hover:bg-violet-50 hover:text-violet-600" title={email}>
                <IconMail className="h-4 w-4" />
              </a>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 opacity-40" title="بدون ایمیل">
                <IconMail className="h-4 w-4" />
              </span>
            )}
          </li>
          <li>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500" title={desk || "میز تحریریه"}>
              <IconMapPin className="h-4 w-4" />
            </span>
          </li>
        </ul>
        <Link
          href={profileHref}
          className="mt-4 block w-full rounded-lg border border-line bg-sheet py-2 text-center text-xs font-semibold text-primary hover:bg-violet-50"
          data-testid="person-profile-link"
        >
          مشاهده پروفایل
        </Link>
      </div>
    </article>
  );
}

export function PersonProfileView({
  data,
  person,
  mode,
  canEditTier,
  onSaveTier,
}: {
  data: NewsroomData;
  person: Person;
  mode: "admin" | "portal";
  canEditTier?: boolean;
  onSaveTier?: (tier: number, note: string) => void;
}) {
  const published = publishedCountForPerson(data, person);
  const worked = workedCountForPerson(data, person);
  const interviews = interviewCountForPerson(data, person);
  const recent = data.stories
    .filter((story) => story.author === person.name)
    .sort((a, b) => (b.updatedAt).localeCompare(a.updatedAt))
    .slice(0, 12);
  const [tier, setTier] = useState(person.reporterTier ?? 3);
  const [tierNote, setTierNote] = useState(person.tierNote ?? "");

  const storyHref = (id: string) => (mode === "portal" ? `/site/${id}` : `/editorial/cartable/${id}`);

  return (
    <div className="mx-auto max-w-4xl space-y-6" data-testid="person-profile">
      <div className="rounded-2xl border border-line bg-sheet p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:text-right">
          <PersonAvatar person={person} className="h-28 w-28" />
          <div className="flex-1 text-center sm:text-right">
            <h1 className="text-2xl font-bold">{person.name}</h1>
            <p className="mt-1 text-sm font-semibold text-violet-600">{person.title}</p>
            <p className="mt-1 text-xs text-muted">{person.kind}</p>
            <p className="mt-4 text-sm leading-8 text-slate-600">{person.bio}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-paper px-3 py-3">
            <dt className="text-xs text-muted">کل خبرهای کار شده</dt>
            <dd className="text-lg font-bold">{faNum(worked)}</dd>
          </div>
          <div className="rounded-xl bg-paper px-3 py-3">
            <dt className="text-xs text-muted">اخبار منتشرشده</dt>
            <dd className="text-lg font-bold">{faNum(published)}</dd>
          </div>
          <div className="rounded-xl bg-paper px-3 py-3">
            <dt className="text-xs text-muted">مصاحبه / برنامه</dt>
            <dd className="text-lg font-bold">{faNum(interviews)}</dd>
          </div>
          <div className="rounded-xl bg-paper px-3 py-3">
            <dt className="text-xs text-muted">عضویت</dt>
            <dd className="text-sm font-bold">{person.joinedAt ? faDate(person.joinedAt) : "—"}</dd>
          </div>
        </dl>
        <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
          <p className="text-xs font-semibold text-violet-800">رتبه خبرنگار (سردبیر)</p>
          <p className="mt-1 text-lg tracking-widest text-amber-500" aria-label={`رتبه ${tier} از ۵`}>
            {reporterTierStars(person.reporterTier)}
          </p>
          {person.tierNote ? <p className="mt-2 text-sm text-slate-600">{person.tierNote}</p> : null}
          {canEditTier && onSaveTier ? (
            <div className="mt-3 space-y-2 border-t border-violet-100 pt-3">
              <label className="block text-xs text-muted">
                تنظیم رتبه (۱ تا ۵)
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={tier}
                  onChange={(event) => setTier(Number(event.target.value))}
                  className="mt-1 w-full"
                />
              </label>
              <textarea
                className="w-full rounded-lg border border-line bg-sheet p-2 text-sm"
                rows={2}
                placeholder="توضیح سردبیر"
                value={tierNote}
                onChange={(event) => setTierNote(event.target.value)}
              />
              <Button type="button" className="text-xs" onClick={() => onSaveTier(tier, tierNote.trim())}>
                ذخیره رتبه
              </Button>
            </div>
          ) : null}
        </div>
        <ul className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
          {person.phone ? <li dir="ltr">تلفن: {person.phone}</li> : null}
          {person.email ? <li dir="ltr">ایمیل: {person.email}</li> : null}
          {person.desk ? <li>میز: {person.desk}</li> : null}
        </ul>
      </div>
      <section className="rounded-2xl border border-line bg-sheet p-6 shadow-sm">
        <h2 className="text-lg font-bold">آخرین خبرهای کارشده</h2>
        {recent.length ? (
          <ul className="mt-3 divide-y divide-line">
            {recent.map((story) => (
              <li key={story.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <Link href={storyHref(story.id)} className="font-medium text-primary hover:underline">
                  {story.title}
                </Link>
                <span className="text-xs text-muted">{story.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">هنوز خبری به این نام ثبت نشده است.</p>
        )}
      </section>
    </div>
  );
}

/** @deprecated use PersonProfileView on dedicated route */
export function PersonProfileModal({
  data,
  person,
  onClose,
}: {
  data: NewsroomData;
  person: Person | null;
  onClose: () => void;
}) {
  if (!person) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="بستن" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-sheet p-4 shadow-xl">
        <PersonProfileView data={data} person={person} mode="admin" />
        <Button type="button" className="mt-4 w-full" tone="ghost" onClick={onClose}>
          بستن
        </Button>
      </div>
    </div>
  );
}
