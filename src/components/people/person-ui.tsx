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
import { applyUserAvatar, avatarUrlForPerson, clearUserAvatar } from "@/lib/user-avatar";
import { useNewsroom } from "@/lib/store";
import type { NewsroomData, Person, RoleBase } from "@/lib/types";
import type { PersonContactPatch } from "@/lib/person-profile";
import { MediaLibraryModal } from "../media/media-library-modal";
import { Button, cn, Flash } from "../ui";

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

export function PersonAvatar({ person, className, src }: { person: Person; className?: string; src?: string }) {
  const image = src ?? person.avatarUrl;
  if (image) {
    return (
      <img
        src={image}
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

  const profileHref = mode === "portal" ? `/people/${person.id}` : `/admin/colleague/${person.id}`;

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
  const profileHref = mode === "portal" ? `/people/${person.id}` : `/admin/colleague/${person.id}`;
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
        <PersonAvatar person={person} src={avatarUrlForPerson(data, person)} />
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

function PersonAvatarEditor({
  person,
  userId,
}: {
  person: Person;
  userId: string;
}) {
  const { data, update } = useNewsroom();
  const [preview, setPreview] = useState<string | undefined>(() => avatarUrlForPerson(data, person));
  const [flash, setFlash] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hoverAvatar, setHoverAvatar] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(avatarUrlForPerson(data, person));
  }, [data, person]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(false), 6000);
    return () => window.clearTimeout(timer);
  }, [success]);

  function saveAvatar(url: string) {
    setPreview(url);
    update((current) => applyUserAvatar(current, userId, url));
    setUploading(false);
    setSuccess(true);
    setFlash("");
  }

  function clearAvatar() {
    setPreview(undefined);
    update((current) => clearUserAvatar(current, userId));
    setSuccess(false);
    setFlash("به آواتار پیش‌فرض بازگشتید.");
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFlash("فقط فایل تصویر مجاز است.");
      return;
    }
    if (file.size > 2_500_000) {
      setFlash("حجم تصویر زیاد است. کمتر از ۲٫۵ مگابایت انتخاب کنید.");
      return;
    }
    setUploading(true);
    setSuccess(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") saveAvatar(reader.result);
      else setUploading(false);
    };
    reader.onerror = () => {
      setUploading(false);
      setFlash("خطا در خواندن فایل تصویر.");
    };
    reader.readAsDataURL(file);
  }

  function pickFromLibrary(src: string) {
    setUploading(true);
    setSuccess(false);
    window.setTimeout(() => saveAvatar(src), 200);
  }

  const hasCustomPhoto = Boolean(preview);

  return (
    <div className="flex flex-col items-center gap-3" data-testid="person-avatar-editor">
      <div
        className="relative"
        onMouseEnter={() => setHoverAvatar(true)}
        onMouseLeave={() => setHoverAvatar(false)}
      >
        <PersonAvatar
          person={person}
          src={preview}
          className={cn(
            "h-32 w-32 ring-4 transition-all duration-200",
            success ? "ring-emerald-500" : "ring-primary/20",
            uploading && "opacity-70",
          )}
        />
        {uploading ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 text-white"
            data-testid="person-avatar-loading"
          >
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
            <span className="mt-2 px-2 text-center text-[11px] font-semibold leading-tight">در حال بارگذاری تصویر...</span>
          </div>
        ) : null}
        {!uploading && (hoverAvatar || !hasCustomPhoto) ? (
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 px-2 text-center text-xs font-bold text-white transition-opacity hover:bg-black/55"
            data-testid="person-avatar-overlay"
            onClick={() => fileRef.current?.click()}
          >
            بارگذاری تصویر جدید
          </button>
        ) : null}
        {success ? (
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow"
            data-testid="person-avatar-success-badge"
          >
            ذخیره شد
          </span>
        ) : null}
      </div>
      {success ? (
        <p
          role="status"
          className="w-full max-w-xs rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-800"
          data-testid="person-avatar-success-toast"
        >
          تصویر پروفایل با موفقیت به‌روزرسانی شد
        </p>
      ) : null}
      <Flash>{flash}</Flash>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" data-testid="person-avatar-file" onChange={onFile} />
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          className="text-xs"
          data-testid="person-avatar-upload-btn"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          تغییر عکس پرسنلی / بارگذاری تصویر
        </Button>
        <Button type="button" tone="ghost" className="text-xs" disabled={uploading} onClick={() => setMediaOpen(true)}>
          انتخاب از کتابخانه
        </Button>
        {hasCustomPhoto ? (
          <Button type="button" tone="quiet" className="text-xs" data-testid="person-avatar-clear-btn" disabled={uploading} onClick={clearAvatar}>
            حذف تصویر / بازگشت به آواتار پیش‌فرض
          </Button>
        ) : null}
      </div>
      <MediaLibraryModal
        open={mediaOpen}
        title="عکس پرسنلی"
        confirmLabel="استفاده به‌عنوان عکس"
        onClose={() => setMediaOpen(false)}
        onPick={(src) => {
          pickFromLibrary(src);
          setMediaOpen(false);
        }}
      />
    </div>
  );
}

function PersonContactEditor({
  person,
  onSave,
}: {
  person: Person;
  onSave: (patch: PersonContactPatch) => void;
}) {
  const [bio, setBio] = useState(person.bio);
  const [title, setTitle] = useState(person.title);
  const [phone, setPhone] = useState(person.phone ?? "");
  const [email, setEmail] = useState(person.email ?? "");
  const [desk, setDesk] = useState(person.desk ?? "");
  const [flash, setFlash] = useState("");

  return (
    <form
      className="mt-4 space-y-3 rounded-xl border border-line bg-paper p-4"
      data-testid="person-contact-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ bio, title, phone, email, desk });
        setFlash("اطلاعات تماس ذخیره شد.");
      }}
    >
      <Flash>{flash}</Flash>
      <label className="block text-sm">
        <span className="text-xs text-muted">سمت / عنوان</span>
        <input className="mt-1 w-full rounded-lg border border-line bg-sheet px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="text-xs text-muted">بیوگرافی</span>
        <textarea className="mt-1 w-full rounded-lg border border-line bg-sheet px-3 py-2 text-sm" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-xs text-muted">تلفن</span>
          <input className="mt-1 w-full rounded-lg border border-line bg-sheet px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </label>
        <label className="block text-sm">
          <span className="text-xs text-muted">ایمیل</span>
          <input className="mt-1 w-full rounded-lg border border-line bg-sheet px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-xs text-muted">میز / محل کار</span>
        <input className="mt-1 w-full rounded-lg border border-line bg-sheet px-3 py-2 text-sm" value={desk} onChange={(e) => setDesk(e.target.value)} />
      </label>
      <Button type="submit" className="text-xs" data-testid="person-contact-save">ذخیره اطلاعات تماس</Button>
    </form>
  );
}

export function PersonProfileView({
  data,
  person,
  mode,
  canEditTier,
  onSaveTier,
  canEditAvatar,
  avatarUserId,
  canEditContact,
  onSaveContact,
  roleBase,
}: {
  data: NewsroomData;
  person: Person;
  mode: "admin" | "portal";
  canEditTier?: boolean;
  onSaveTier?: (tier: number, note: string) => void;
  canEditAvatar?: boolean;
  avatarUserId?: string;
  canEditContact?: boolean;
  onSaveContact?: (patch: PersonContactPatch) => void;
  roleBase?: RoleBase;
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

  const storyHref = (id: string) => (mode === "portal" ? `/${id}` : `/admin/editorial/cartable/${id}`);

  return (
    <div className="mx-auto max-w-4xl space-y-6" data-testid="person-profile">
      <div className="rounded-2xl border border-line bg-sheet p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:text-right">
          {canEditAvatar && avatarUserId ? (
            <PersonAvatarEditor person={person} userId={avatarUserId} />
          ) : (
            <PersonAvatar person={person} src={avatarUrlForPerson(data, person)} className="h-28 w-28" />
          )}
          <div className="flex-1 text-center sm:text-right">
            <h1 className="text-2xl font-bold" data-testid="person-profile-name">{person.name}</h1>
            <p className="mt-1 text-sm font-semibold text-violet-600">{person.title}</p>
            <p className="mt-1 text-xs text-muted" data-testid="person-profile-role">{person.kind}</p>
            {roleBase ? (
              <p className="mt-1 text-[11px] font-medium text-primary" data-testid="person-profile-role-base">
                نقش سامانه: {roleBase === "publisher" ? "مدیر مسئول" : roleBase === "chief" ? "سردبیر" : "خبرنگار / تحریریه"}
              </p>
            ) : null}
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
        {canEditContact && onSaveContact ? <PersonContactEditor person={person} onSave={onSaveContact} /> : null}
        <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
          <p className="text-xs font-semibold text-violet-800">
            {roleBase === "reporter" || !roleBase ? "رتبه خبرنگار (سردبیر)" : "رتبه / جایگاه تحریریه"}
          </p>
          <p className="mt-1 text-lg tracking-widest text-amber-500" aria-label={`رتبه ${tier} از ۵`}>
            {roleBase === "reporter" || !roleBase ? reporterTierStars(person.reporterTier) : personEditorialRank(person)}
          </p>
          {person.tierNote && (roleBase === "reporter" || !roleBase) ? <p className="mt-2 text-sm text-slate-600">{person.tierNote}</p> : null}
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
