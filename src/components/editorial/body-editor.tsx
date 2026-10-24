"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { plainTextToHtml } from "@/lib/format";
import { Button } from "../ui";

export function StoryBodyEditor({
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel = "متن خبر",
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || focused || syncing.current) return;
    const html = plainTextToHtml(value);
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [value, focused]);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el || syncing.current) return;
    onChange(el.innerHTML);
  }, [onChange]);

  function run(command: string, arg?: string) {
    if (disabled) return;
    ref.current?.focus();
    syncing.current = true;
    document.execCommand(command, false, arg);
    syncing.current = false;
    emit();
  }

  function insertLink() {
    if (disabled) return;
    const url = window.prompt("نشانی پیوند:", "https://");
    if (!url?.trim()) return;
    run("createLink", url.trim());
  }

  const surfaceClass =
    "min-h-[32rem] w-full px-4 py-4 text-base leading-8 outline-none [&_a]:text-rule [&_a]:underline [&_ol]:list-decimal [&_ol]:pr-8 [&_ul]:list-disc [&_ul]:pr-8";

  return (
    <div className="overflow-hidden rounded-md border border-line bg-sheet">
      <div className="flex flex-wrap gap-1 border-b border-line bg-paper px-2 py-1.5" role="toolbar" aria-label="قالب‌بندی متن">
        <Button type="button" tone="ghost" disabled={disabled} className="px-2 py-1 text-xs" onClick={() => run("bold")}>
          درشت
        </Button>
        <Button type="button" tone="ghost" disabled={disabled} className="px-2 py-1 text-xs" onClick={() => run("italic")}>
          کج
        </Button>
        <Button type="button" tone="ghost" disabled={disabled} className="px-2 py-1 text-xs" onClick={() => run("insertUnorderedList")}>
          فهرست
        </Button>
        <Button type="button" tone="ghost" disabled={disabled} className="px-2 py-1 text-xs" onClick={() => run("insertOrderedList")}>
          فهرست شماره‌دار
        </Button>
        <Button type="button" tone="ghost" disabled={disabled} className="px-2 py-1 text-xs" onClick={insertLink}>
          پیوند
        </Button>
      </div>
      <div
        ref={ref}
        dir="rtl"
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline="true"
        contentEditable={!disabled}
        suppressContentEditableWarning
        className={`${surfaceClass} ${disabled ? "cursor-default bg-sand/30 text-muted" : ""}`}
        onInput={emit}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          emit();
        }}
      />
    </div>
  );
}
