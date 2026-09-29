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

function div(a: number, b: number) {
  return Math.floor(a / b);
}

export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) -
    80 +
    gd +
    gdm[gm - 1];
  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  jy += div(days - 1, 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days =
    365 * jy +
    div(jy, 33) * 8 +
    div((jy % 33) + 3, 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * div(days, 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * div(--days, 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * div(days, 1461);
  days %= 1461;
  gy += div(days - 1, 365);
  if (days > 365) days = (days - 1) % 365;
  const gd = days + 1;
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  let v = gd;
  for (gm = 1; gm <= 12; gm += 1) {
    v -= sal_a[gm];
    if (v <= 0) break;
  }
  return { gy, gm, gd: gd - sal_a[gm - 1] };
}

export function dateToJalaliParts(date: Date): JalaliParts {
  const { jy, jm, jd } = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return { jy, jm, jd, hour: date.getHours(), minute: date.getMinutes() };
}

export function jalaliPartsToIso(parts: JalaliParts): string {
  const { gy, gm, gd } = jalaliToGregorian(parts.jy, parts.jm, parts.jd);
  const d = new Date(gy, gm - 1, gd, parts.hour, parts.minute, 0, 0);
  return d.toISOString();
}

export function formatJalaliDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const time = d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  return `${faNum(jd)} ${JALALI_MONTHS[jm - 1]} ${faNum(jy)} — ${time}`;
}

export function formatJalaliDayHeader(iso: string): string {
  const d = new Date(iso);
  const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const weekday = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long" }).format(d);
  return `${weekday} ${faNum(jd)} ${JALALI_MONTHS[jm - 1]} ${faNum(jy)}`;
}
