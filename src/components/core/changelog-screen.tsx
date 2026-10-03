"use client";

import { useMemo, useState } from "react";
import { JalaliDateTimeField } from "@/components/jalali-datetime-field";
import {
  CHANGELOG_KIND_LABEL,
  type ChangelogChange,
  type ChangelogChangeKind,
  type ChangelogRelease,
  resolveProductChangelog,
  sortChangelogReleases,
  versionDisplay,
} from "@/lib/changelog";
import { faDate } from "@/lib/format";
import { uid } from "@/lib/id";
import { useNewsroom } from "@/lib/store";
import { currentRole } from "@/lib/workflow";
import { Button, Field, Flash, Input, ModulePage, TextArea, cn } from "../ui";

const BADGE_CLASS: Record<ChangelogChangeKind, string> = {
  new: "bg-emerald-100 text-emerald-800 border-emerald-200",
  updated: "bg-violet-100 text-violet-800 border-violet-200",
  fixed: "bg-sky-100 text-sky-800 border-sky-200",
};

function ChangeBadge({ kind }: { kind: ChangelogChangeKind }) {
  return (
    <span className={cn("inline-flex shrink-0 rounded px-2 py-0.5 text-[10px] font-bold border", BADGE_CLASS[kind])}>
      {CHANGELOG_KIND_LABEL[kind]}
    </span>
  );
}

function ReleaseChanges({ release }: { release: ChangelogRelease }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {release.changes.map((item, index) => (
        <li key={`${release.version}-${index}`} className="flex flex-wrap items-start gap-2 text-sm leading-7 text-ink/90">
          <ChangeBadge kind={item.kind} />
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("h-5 w-5 shrink-0 text-muted transition-transform", open && "rotate-180")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

type CategoryForm = Record<ChangelogChangeKind, string[]>;

const EMPTY_CATEGORY: CategoryForm = { new: [""], updated: [""], fixed: [""] };

function buildChanges(form: CategoryForm): ChangelogChange[] {
  const changes: ChangelogChange[] = [];
  (["new", "updated", "fixed"] as ChangelogChangeKind[]).forEach((kind) => {
    form[kind].forEach((text) => {
      const trimmed = text.trim();
      if (trimmed) changes.push({ kind, text: trimmed });
    });
  });
  return changes;
}

function CategoryLines({
  kind,
  label,
  lines,
  onChange,
}: {
  kind: ChangelogChangeKind;
  label: string;
  lines: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-line bg-paper/50 p-3" data-testid={`changelog-form-${kind}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">
          <ChangeBadge kind={kind} /> {label}
        </p>
        <Button type="button" tone="ghost" className="text-xs" onClick={() => onChange([...lines, ""])}>
          + خط جدید
        </Button>
      </div>
      {lines.map((line, index) => (
        <div key={`${kind}-${index}`} className="flex gap-2">
          <Input
            value={line}
            onChange={(event) => {
              const next = [...lines];
              next[index] = event.target.value;
              onChange(next);
            }}
            placeholder="شرح تغییر..."
            data-testid={`changelog-input-${kind}-${index}`}
          />
          {lines.length > 1 ? (
            <Button
              type="button"
              tone="quiet"
              className="shrink-0 text-xs"
              onClick={() => onChange(lines.filter((_, i) => i !== index))}
            >
              حذف
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ChangelogScreen() {
  const { data, update } = useNewsroom();
  const releases = useMemo(() => sortChangelogReleases(resolveProductChangelog(data)), [data.productChangelog]);
  const latest = releases[0];
  const older = releases.slice(1);
  const [openVersion, setOpenVersion] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [version, setVersion] = useState("2.4.1");
  const [jalaliPeriod, setJalaliPeriod] = useState("مهر ۱۴۰۵");
  const [releasedAt, setReleasedAt] = useState(new Date().toISOString());
  const [summary, setSummary] = useState("");
  const [categories, setCategories] = useState<CategoryForm>(EMPTY_CATEGORY);

  const canManage = currentRole(data).base === "chief" || currentRole(data).base === "publisher";

  function resetForm() {
    setVersion("2.4.1");
    setJalaliPeriod("مهر ۱۴۰۵");
    setReleasedAt(new Date().toISOString());
    setSummary("");
    setCategories(EMPTY_CATEGORY);
    setEditingId(null);
  }

  function openCreateForm() {
    resetForm();
    setFormOpen(true);
  }

  function openEditForm(release: ChangelogRelease) {
    if (!release.editable || !release.releaseId) return;
    setEditingId(release.releaseId);
    setVersion(release.version);
    setJalaliPeriod(release.jalaliPeriod);
    setReleasedAt(release.releasedAt);
    setSummary(release.summary ?? "");
    const next: CategoryForm = { new: [""], updated: [""], fixed: [""] };
    (["new", "updated", "fixed"] as ChangelogChangeKind[]).forEach((kind) => {
      const items = release.changes.filter((c) => c.kind === kind).map((c) => c.text);
      next[kind] = items.length ? items : [""];
    });
    setCategories(next);
    setFormOpen(true);
  }

  function saveRelease() {
    const changes = buildChanges(categories);
    if (!version.trim() || !jalaliPeriod.trim() || changes.length === 0) {
      setFlash("شماره نسخه، تاریخ شمسی و حداقل یک مورد تغییر الزامی است.");
      return;
    }
    const payload: ChangelogRelease = {
      releaseId: editingId ?? uid("rel"),
      version: version.trim(),
      jalaliPeriod: jalaliPeriod.trim(),
      releasedAt: releasedAt || new Date().toISOString(),
      summary: summary.trim() || undefined,
      changes,
      editable: true,
    };
    update((current) => {
      const list = resolveProductChangelog(current);
      const without = editingId ? list.filter((item) => item.releaseId !== editingId) : list;
      const productChangelog = sortChangelogReleases([payload, ...without]);
      return { ...current, productChangelog, systemVersion: productChangelog[0]?.version };
    });
    setFormOpen(false);
    resetForm();
    setFlash(editingId ? "نسخه به‌روزرسانی شد." : "نسخه جدید منتشر شد و در فوتر نمایش داده می‌شود.");
  }

  function deleteRelease(release: ChangelogRelease) {
    if (!release.editable || !release.releaseId) return;
    if (!window.confirm(`نسخه ${release.version} حذف شود؟`)) return;
    update((current) => {
      const productChangelog = resolveProductChangelog(current).filter((item) => item.releaseId !== release.releaseId);
      return { ...current, productChangelog, systemVersion: productChangelog[0]?.version ?? current.systemVersion };
    });
    setFlash("نسخه حذف شد.");
  }

  return (
    <ModulePage slug="changelog">
      <Flash>{flash}</Flash>
      <div className="mx-auto max-w-3xl space-y-6" data-testid="changelog-page">
        {canManage ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" data-testid="changelog-add-version" onClick={openCreateForm}>
              افزودن نسخه جدید
            </Button>
          </div>
        ) : null}

        {formOpen ? (
          <section
            className="rounded-2xl border border-violet-200 bg-sheet p-5 shadow-sm"
            data-testid="changelog-version-form"
          >
            <h3 className="text-lg font-bold">{editingId ? "ویرایش نسخه" : "ثبت نسخه جدید"}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="شماره نسخه">
                <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="2.4.1" data-testid="changelog-form-version" dir="ltr" />
              </Field>
              <Field label="تاریخ انتشار (برچسب شمسی)">
                <Input value={jalaliPeriod} onChange={(e) => setJalaliPeriod(e.target.value)} placeholder="مهر ۱۴۰۵" data-testid="changelog-form-jalali-label" />
              </Field>
            </div>
            <JalaliDateTimeField
              label="تاریخ انتشار (تقویم شمسی)"
              value={releasedAt}
              onChange={setReleasedAt}
              testId="changelog-form-released-at"
            />
            <Field label="خلاصه انتشار (اختیاری)">
              <TextArea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </Field>
            <div className="space-y-3">
              <CategoryLines
                kind="new"
                label="ویژگی‌های جدید"
                lines={categories.new}
                onChange={(next) => setCategories((c) => ({ ...c, new: next }))}
              />
              <CategoryLines
                kind="updated"
                label="به‌روزرسانی‌ها"
                lines={categories.updated}
                onChange={(next) => setCategories((c) => ({ ...c, updated: next }))}
              />
              <CategoryLines
                kind="fixed"
                label="رفع اشکال"
                lines={categories.fixed}
                onChange={(next) => setCategories((c) => ({ ...c, fixed: next }))}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" data-testid="changelog-submit-version" onClick={saveRelease}>
                ثبت و انتشار نسخه جدید
              </Button>
              <Button type="button" tone="ghost" onClick={() => { setFormOpen(false); resetForm(); }}>
                انصراف
              </Button>
            </div>
          </section>
        ) : null}

        {latest ? (
          <section
            className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-l from-violet-50 via-sheet to-primary-light/30 p-6 shadow-sm"
            data-testid="changelog-latest-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">آخرین انتشار</p>
                <h2 className="mt-1 text-2xl font-black text-ink">
                  نسخه <span dir="ltr">{versionDisplay(latest.version)}</span>
                </h2>
                <p className="mt-1 text-sm text-muted">{latest.jalaliPeriod} · {faDate(latest.releasedAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">فعلی</span>
                {canManage && latest.editable && latest.releaseId ? (
                  <div className="flex gap-2">
                    <Button type="button" tone="ghost" className="text-xs" onClick={() => openEditForm(latest)}>
                      ویرایش
                    </Button>
                    <Button type="button" tone="quiet" className="text-xs" onClick={() => deleteRelease(latest)}>
                      حذف
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
            {latest.summary ? <p className="mt-4 text-sm leading-8 text-ink/80">{latest.summary}</p> : null}
            <ReleaseChanges release={latest} />
          </section>
        ) : null}

        <section>
          <h3 className="mb-3 text-sm font-bold text-muted">نسخه‌های قبلی</h3>
          <div className="space-y-2">
            {older.map((release) => {
              const expanded = openVersion === release.version;
              return (
                <article
                  key={release.releaseId ?? release.version}
                  className="rounded-xl border border-line bg-sheet shadow-sm"
                  data-testid={`changelog-release-${release.version}`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right"
                    aria-expanded={expanded}
                    onClick={() => setOpenVersion(expanded ? null : release.version)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink">
                        نسخه <span dir="ltr">{versionDisplay(release.version)}</span>
                      </p>
                      <p className="text-xs text-muted">{release.jalaliPeriod} · {faDate(release.releasedAt)}</p>
                    </div>
                    <Chevron open={expanded} />
                  </button>
                  {expanded ? (
                    <div className="border-t border-line px-4 pb-4">
                      {canManage && release.editable && release.releaseId ? (
                        <div className="mt-3 flex gap-2">
                          <Button type="button" tone="ghost" className="text-xs" onClick={() => openEditForm(release)}>
                            ویرایش
                          </Button>
                          <Button type="button" tone="quiet" className="text-xs" onClick={() => deleteRelease(release)}>
                            حذف
                          </Button>
                        </div>
                      ) : null}
                      {release.summary ? <p className="mt-3 text-sm text-muted">{release.summary}</p> : null}
                      <ReleaseChanges release={release} />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </ModulePage>
  );
}
