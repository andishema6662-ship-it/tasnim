"use client";

import Link from "next/link";
import { CHANGELOG_HREF, SYSTEM_PRODUCT_NAME, SYSTEM_VERSION, versionDisplay } from "@/lib/changelog";
import { cn } from "../ui";

export function SystemVersionFooter({ className }: { className?: string }) {
  return (
    <footer
      role="contentinfo"
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-line/80 bg-paper/40 px-4 py-3 text-center text-xs text-muted",
        className,
      )}
      data-testid="system-version-footer"
    >
      <span>
        {SYSTEM_PRODUCT_NAME} — نسخه{" "}
        <span className="font-semibold text-ink" dir="ltr">{versionDisplay(SYSTEM_VERSION)}</span>
      </span>
      <span className="hidden text-line sm:inline" aria-hidden>·</span>
      <Link href={CHANGELOG_HREF} className="font-semibold text-primary hover:underline" data-testid="system-changelog-link">
        گزارش تغییرات و به‌روزرسانی‌ها
      </Link>
    </footer>
  );
}
