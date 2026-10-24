"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../ui";

const toneClass = {
  default: "text-muted hover:border-line hover:bg-sand hover:text-ink",
  accent: "text-accent-blue hover:border-accent-blue/30 hover:bg-accent-blue/10 hover:text-accent-blue",
  danger: "text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-700",
  success: "text-muted hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800",
};

export function IconButton({
  label,
  tone = "default",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: keyof typeof toneClass;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors disabled:pointer-events-none disabled:opacity-40",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconUserOff({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M17 8l4 4M21 8l-4 4" />
    </svg>
  );
}

export function IconUserCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M17 11l2 2 4-4" />
    </svg>
  );
}
