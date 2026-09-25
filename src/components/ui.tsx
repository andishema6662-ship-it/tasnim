"use client";

import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { groups, moduleBySlug } from "@/lib/modules";
import type { Status } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const inputClass = "w-full rounded-md border border-line bg-sheet px-3 py-2 text-sm text-ink";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-24 leading-7", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, props.className)} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

const tones = {
  primary: "bg-ink text-sheet hover:bg-ink/90",
  accent: "bg-rule text-white hover:bg-rule/90",
  ghost: "border border-line bg-sheet hover:bg-sand",
  quiet: "text-muted hover:text-ink",
};

export function Button({
  tone = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof tones }) {
  return (
    <button
      type={type}
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium disabled:pointer-events-none disabled:opacity-40",
        tones[tone],
        className,
      )}
    />
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-line bg-sand/80 px-3 py-2 text-sm leading-7 text-ink">{children}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</p>;
}

export function Sheet({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-line bg-sheet", className)}>{children}</section>;
}

const statusTone: Record<Status, string> = {
  draft: "bg-sand text-ink",
  editing: "bg-amber-100 text-amber-950",
  review: "bg-sky-100 text-sky-950",
  ready: "bg-teal-100 text-teal-950",
  published: "bg-rule text-white",
  archived: "bg-stone-200 text-stone-700",
};

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs", statusTone[status])}>{label}</span>;
}

export function Page({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} · اتاق خبر`;
  }, [title]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-xs font-semibold text-rule">{eyebrow}</p> : null}
          <h1 className="text-2xl font-bold leading-snug">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-7 text-muted">{description}</p> : null}
        </div>
        {actions}
      </header>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function ModulePage({
  slug,
  actions,
  children,
}: {
  slug: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const mod = moduleBySlug(slug);
  const group = groups.find((item) => item.id === mod?.group);
  return (
    <Page eyebrow={group?.title} title={mod?.title ?? slug} description={mod?.description} actions={actions}>
      {children}
    </Page>
  );
}

export function Flash({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="status" className="rounded-md border border-line bg-sand px-3 py-2 text-sm">
      {children}
    </p>
  );
}
