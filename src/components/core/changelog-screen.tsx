"use client";

import { useState } from "react";
import {
  CHANGELOG_KIND_LABEL,
  PRODUCT_CHANGELOG,
  type ChangelogChangeKind,
  type ChangelogRelease,
  versionDisplay,
} from "@/lib/changelog";
import { faDate } from "@/lib/format";
import { ModulePage, cn } from "../ui";

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

export function ChangelogScreen() {
  const [openVersion, setOpenVersion] = useState<string | null>(null);
  const latest = PRODUCT_CHANGELOG[0];
  const older = PRODUCT_CHANGELOG.slice(1);

  return (
    <ModulePage slug="changelog">
      <div className="mx-auto max-w-3xl space-y-6" data-testid="changelog-page">
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
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">فعلی</span>
          </div>
          {latest.summary ? <p className="mt-4 text-sm leading-8 text-ink/80">{latest.summary}</p> : null}
          <ReleaseChanges release={latest} />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold text-muted">نسخه‌های قبلی</h3>
          <div className="space-y-2">
            {older.map((release) => {
              const expanded = openVersion === release.version;
              return (
                <article
                  key={release.version}
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
