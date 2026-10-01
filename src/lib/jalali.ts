import { faNum } from "./format";

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export interface JalaliParts {
  jy: number;
  jm: number;
  jd: number;
  hour: number;
  minute: number;
}

const persianDtf = new Intl.DateTimeFormat("en-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/** Authoritative Jalali (Persian) calendar parts via ICU — avoids manual conversion drift. */
export function persianPartsFromDate(date: Date): { jy: number; jm: number; jd: number } {
  const bag: Partial<Record<"year" | "month" | "day", number>> = {};
  for (const part of persianDtf.formatToParts(date)) {
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      bag[part.type] = Number(part.value);
    }
  }
  return { jy: bag.year ?? 1400, jm: bag.month ?? 1, jd: bag.day ?? 1 };
}

export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  return persianPartsFromDate(new Date(gy, gm - 1, gd, 12, 0, 0, 0));
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  const iso = jalaliPartsToIso({ jy, jm, jd, hour: 12, minute: 0 });
  const d = new Date(iso);
  return { gy: d.getFullYear(), gm: d.getMonth() + 1, gd: d.getDate() };
}

export function dateToJalaliParts(date: Date): JalaliParts {
  const { jy, jm, jd } = persianPartsFromDate(date);
  return { jy, jm, jd, hour: date.getHours(), minute: date.getMinutes() };
}

export function jalaliPartsToIso(parts: JalaliParts): string {
  const approx = new Date(parts.jy + 621, 2, 21, parts.hour, parts.minute, 0, 0);
  for (let delta = -500; delta <= 500; delta += 1) {
    const d = new Date(approx.getTime() + delta * 86_400_000);
    const p = persianPartsFromDate(d);
    if (p.jy === parts.jy && p.jm === parts.jm && p.jd === parts.jd) {
      d.setHours(parts.hour, parts.minute, 0, 0);
      return d.toISOString();
    }
  }
  approx.setHours(parts.hour, parts.minute, 0, 0);
  return approx.toISOString();
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const p30 = persianPartsFromDate(new Date(jalaliPartsToIso({ jy, jm: 12, jd: 30, hour: 12, minute: 0 })));
  return p30.jm === 12 && p30.jd === 30 ? 30 : 29;
}

/** Saturday = 0 … Friday = 6 */
export function jalaliWeekday(jy: number, jm: number, jd: number): number {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const js = new Date(gy, gm - 1, gd).getDay();
  return (js + 1) % 7;
}

export const JALALI_WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

export function formatJalaliDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const { jy, jm, jd } = persianPartsFromDate(d);
  const time = d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  return `${faNum(jd)} ${JALALI_MONTHS[jm - 1]} ${faNum(jy)} — ${time}`;
}

export function formatJalaliDayHeader(iso: string): string {
  const d = new Date(iso);
  const { jy, jm, jd } = persianPartsFromDate(d);
  const weekday = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long" }).format(d);
  return `${weekday} ${faNum(jd)} ${JALALI_MONTHS[jm - 1]} ${faNum(jy)}`;
}
