"use client";

import Link from "next/link";
import { faDate, faDay, faNum } from "@/lib/format";
import { personEditorialRank, publishedCountForPerson } from "@/lib/people";
import type { NewsroomData, Person } from "@/lib/types";
import { Button, cn } from "../ui";

export function PersonAvatar({ person, className }: { person: Person; className?: string }) {
  if (person.avatarUrl) {
    return (
      <img
        src={person.avatarUrl}
        alt=""
        className={cn(
          "h-20 w-20 shrink-0 rounded-full object-cover shadow ring-2 ring-violet-100",
          className,
        )}
      />
    );
  }
  const initial = person.name.trim().slice(0, 1) || "؟";
  return (
    <div
      className={cn(
        "flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-50 text-2xl font-bold text-violet-700 shadow ring-2 ring-violet-100",
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
  onProfile?: () => void;
};

export function PersonHexaCard({ data, person, mode, canManage, onEdit, onDelete, onProfile }: PersonCardProps) {
  const ticketHref = `/admin/tickets?new=1&subject=${encodeURIComponent(`تماس با ${person.name}`)}`;

  return (
    <article
      className="flex flex-col items-center gap-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md xl:flex-row xl:items-start"
      data-testid="person-card"
    >
      <PersonAvatar person={person} />
      <div className="min-w-0 flex-1 text-center xl:text-right">
        <h2 className="text-lg font-bold text-slate-800">{person.name}</h2>
        <p className="mt-0.5 text-sm font-medium text-violet-600">{person.title}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-7 text-slate-500">{person.bio}</p>
        <PersonStats data={data} person={person} />
      </div>
      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto xl:min-w-[9.5rem]">
        {mode === "admin" ? (
          <>
            <Button type="button" tone="ghost" className="w-full text-xs" onClick={onProfile}>
              نمایش پروفایل / کارنامه
            </Button>
            <Link href={ticketHref} className="inline-flex w-full items-center justify-center rounded-lg border border-line bg-sheet px-3 py-2 text-xs font-medium hover:bg-sand">
              پیام / تماس / تیکت
            </Link>
            {canManage ? (
              <div className="flex gap-2">
                <Button type="button" tone="ghost" className="flex-1 text-xs" onClick={onEdit}>
                  ویرایش
                </Button>
                <Button type="button" tone="quiet" className="flex-1 text-xs text-red-700" onClick={onDelete}>
                  حذف
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-600">
            {person.kind}
          </p>
        )}
      </div>
    </article>
  );
}

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
  const published = publishedCountForPerson(data, person);
  const recent = data.stories
    .filter((story) => story.author === person.name && story.status === "published")
    .sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt))
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="بستن" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-sheet p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <PersonAvatar person={person} />
          <div>
            <h2 className="text-xl font-bold">{person.name}</h2>
            <p className="text-sm font-medium text-violet-600">{person.title}</p>
            <p className="mt-1 text-xs text-muted">{person.kind}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7">{person.bio}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-paper px-3 py-2">
            <dt className="text-xs text-muted">اخبار منتشرشده</dt>
            <dd className="font-bold">{faNum(published)}</dd>
          </div>
          <div className="rounded-lg bg-paper px-3 py-2">
            <dt className="text-xs text-muted">رتبه تحریریه</dt>
            <dd className="font-bold">{personEditorialRank(person)}</dd>
          </div>
          <div className="col-span-2 rounded-lg bg-paper px-3 py-2">
            <dt className="text-xs text-muted">تاریخ عضویت</dt>
            <dd className="font-bold">{person.joinedAt ? faDate(person.joinedAt) : "—"}</dd>
          </div>
        </dl>
        {recent.length ? (
          <div className="mt-4">
            <h3 className="text-sm font-bold">آخرین خروجی‌ها</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {recent.map((story) => (
                <li key={story.id} className="line-clamp-1">{story.title}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <Button type="button" className="mt-6 w-full" tone="ghost" onClick={onClose}>
          بستن
        </Button>
      </div>
    </div>
  );
}
