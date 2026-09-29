"use client";

import { useMemo } from "react";
import { JALALI_MONTHS, dateToJalaliParts, jalaliPartsToIso, type JalaliParts } from "@/lib/jalali";
import { faNum } from "@/lib/format";
import { Field, Select } from "./ui";

function partsFromIso(iso: string): JalaliParts {
  if (!iso) {
    const now = new Date();
    now.setMinutes(0);
    return dateToJalaliParts(now);
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dateToJalaliParts(new Date());
  return dateToJalaliParts(d);
}

export function JalaliDateTimeField({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  testId?: string;
}) {
  const parts = useMemo(() => partsFromIso(value), [value]);
  const years = useMemo(() => {
    const current = dateToJalaliParts(new Date()).jy;
    return Array.from({ length: 5 }, (_, i) => current - 1 + i);
  }, []);

  function patch(partial: Partial<JalaliParts>) {
    const next = { ...parts, ...partial };
    onChange(jalaliPartsToIso(next));
  }

  return (
    <Field label={label}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" data-testid={testId}>
        <Select aria-label="سال شمسی" value={parts.jy} onChange={(e) => patch({ jy: Number(e.target.value) })}>
          {years.map((y) => (
            <option key={y} value={y}>{faNum(y)}</option>
          ))}
        </Select>
        <Select aria-label="ماه شمسی" value={parts.jm} onChange={(e) => patch({ jm: Number(e.target.value) })}>
          {JALALI_MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>{name}</option>
          ))}
        </Select>
        <Select aria-label="روز شمسی" value={parts.jd} onChange={(e) => patch({ jd: Number(e.target.value) })}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{faNum(d)}</option>
          ))}
        </Select>
        <Select aria-label="ساعت" value={parts.hour} onChange={(e) => patch({ hour: Number(e.target.value) })}>
          {Array.from({ length: 24 }, (_, i) => i).map((h) => (
            <option key={h} value={h}>{faNum(h)}</option>
          ))}
        </Select>
        <Select aria-label="دقیقه" value={parts.minute} onChange={(e) => patch({ minute: Number(e.target.value) })}>
          {[0, 15, 30, 45].map((m) => (
            <option key={m} value={m}>{faNum(m)}</option>
          ))}
        </Select>
      </div>
      <p className="mt-1 text-xs text-muted" dir="rtl">تقویم شمسی (جلالی)</p>
    </Field>
  );
}
