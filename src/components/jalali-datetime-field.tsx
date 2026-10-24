"use client";

import { JalaliDateTimePicker } from "./jalali-datetime-picker";

/** Compact Jalali date-time control (calendar popover). */
export function JalaliDateTimeField({
  label,
  value,
  onChange,
  testId,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  testId?: string;
  disabled?: boolean;
}) {
  return <JalaliDateTimePicker label={label} value={value} onChange={onChange} testId={testId} disabled={disabled} />;
}
