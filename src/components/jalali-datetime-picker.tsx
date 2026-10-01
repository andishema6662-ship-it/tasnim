"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS_SHORT,
  dateToJalaliParts,
  formatJalaliDateTime,
  jalaliMonthLength,
  jalaliPartsToIso,
  jalaliWeekday,
  type JalaliParts,
} from "@/lib/jalali";
import { faNum } from "@/lib/format";
import { Button, cn, Field } from "./ui";

function partsFromIso(iso: string): JalaliParts {
  if (!iso) {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
    return dateToJalaliParts(now);
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dateToJalaliParts(new Date());
  return dateToJalaliParts(d);
}

export function JalaliDateTimePicker({
  label,
  value,
  onChange,
  testId = "jalali-datetime-picker",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  testId?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [parts, setParts] = useState<JalaliParts>(() => partsFromIso(value));
  const rootRef = useRef<HTMLDivElement>(null);

  function toggleOpen() {
    if (disabled) return;
    if (!open) setParts(partsFromIso(value));
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const years = useMemo(() => {
    const current = dateToJalaliParts(new Date()).jy;
    return Array.from({ length: 7 }, (_, i) => current - 2 + i);
  }, []);

  const monthDays = useMemo(() => jalaliMonthLength(parts.jy, parts.jm), [parts.jy, parts.jm]);
  const firstWeekday = useMemo(() => jalaliWeekday(parts.jy, parts.jm, 1), [parts.jy, parts.jm]);

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let d = 1; d <= monthDays; d += 1) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [firstWeekday, monthDays]);

  function commit(next: JalaliParts) {
    setParts(next);
    onChange(jalaliPartsToIso(next));
  }

  function shiftMonth(delta: number) {
    let jm = parts.jm + delta;
    let jy = parts.jy;
    while (jm > 12) {
      jm -= 12;
      jy += 1;
    }
    while (jm < 1) {
      jm += 12;
      jy -= 1;
    }
    const jd = Math.min(parts.jd, jalaliMonthLength(jy, jm));
    commit({ ...parts, jy, jm, jd });
  }

  const display = value ? formatJalaliDateTime(value) : "انتخاب تاریخ و ساعت شمسی";

  return (
    <Field label={label}>
      <div className="relative" ref={rootRef} data-testid={testId}>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-line bg-paper px-3 py-2 text-right text-sm",
            disabled && "opacity-60",
          )}
          onClick={toggleOpen}
          data-testid={`${testId}-trigger`}
          aria-expanded={open}
        >
          <span className="text-muted">{open ? "▲" : "▼"}</span>
          <span dir="rtl">{display}</span>
        </button>
        {open ? (
          <div
            className="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-line bg-sheet p-3 shadow-xl sm:left-auto sm:right-0 sm:w-[20rem]"
            data-testid={`${testId}-popover`}
            role="dialog"
            aria-label="تقویم شمسی"
          >
            <div className="flex items-center justify-between gap-2">
              <Button type="button" tone="ghost" className="text-xs" onClick={() => shiftMonth(-1)} aria-label="ماه قبل">‹</Button>
              <p className="text-sm font-bold">
                {JALALI_MONTHS[parts.jm - 1]} {faNum(parts.jy)}
              </p>
              <Button type="button" tone="ghost" className="text-xs" onClick={() => shiftMonth(1)} aria-label="ماه بعد">›</Button>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
              {JALALI_WEEKDAYS_SHORT.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarCells.map((day, index) =>
                day === null ? (
                  <span key={`empty-${index}`} />
                ) : (
                  <button
                    key={day}
                    type="button"
                    className={cn(
                      "rounded-lg py-1.5 text-sm transition-colors hover:bg-violet-50",
                      parts.jd === day && "bg-primary font-bold text-white hover:bg-primary",
                    )}
                    onClick={() => commit({ ...parts, jd: day })}
                  >
                    {faNum(day)}
                  </button>
                ),
              )}
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <p className="mb-2 text-xs font-semibold text-muted">ساعت و دقیقه</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">
                  ساعت
                  <select
                    className="mt-1 w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-sm"
                    value={parts.hour}
                    aria-label="ساعت"
                    onChange={(event) => commit({ ...parts, hour: Number(event.target.value) })}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{faNum(h)}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  دقیقه
                  <select
                    className="mt-1 w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-sm"
                    value={parts.minute}
                    aria-label="دقیقه"
                    onChange={(event) => commit({ ...parts, minute: Number(event.target.value) })}
                  >
                    {Array.from({ length: 60 }, (_, m) => (
                      <option key={m} value={m}>{faNum(m)}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                className="flex-1 rounded-lg border border-line bg-paper px-2 py-1 text-xs"
                value={parts.jy}
                aria-label="سال شمسی"
                onChange={(event) => commit({ ...parts, jy: Number(event.target.value) })}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{faNum(y)}</option>
                ))}
              </select>
              <select
                className="flex-1 rounded-lg border border-line bg-paper px-2 py-1 text-xs"
                value={parts.jm}
                aria-label="ماه شمسی"
                onChange={(event) => {
                  const jm = Number(event.target.value);
                  const jd = Math.min(parts.jd, jalaliMonthLength(parts.jy, jm));
                  commit({ ...parts, jm, jd });
                }}
              >
                {JALALI_MONTHS.map((name, index) => (
                  <option key={name} value={index + 1}>{name}</option>
                ))}
              </select>
            </div>
            <Button type="button" className="mt-3 w-full text-xs" onClick={() => setOpen(false)}>تأیید</Button>
          </div>
        ) : null}
      </div>
    </Field>
  );
}
