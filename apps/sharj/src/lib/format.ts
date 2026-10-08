import * as jalaali from 'jalaali-js'

/** Persian digits */
export function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

export function toman(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(n)) + ' تومان'
}

const MONTHS_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const

export function jalaliMonthName(jm: number): string {
  return MONTHS_FA[jm - 1] ?? String(jm)
}

export interface JalaliParts {
  jy: number
  jm: number
  jd: number
  hour: number
  minute: number
}

export function toJalaliParts(iso: string): JalaliParts | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const { jy, jm, jd } = jalaali.toJalaali(d)
  return {
    jy,
    jm,
    jd,
    hour: d.getHours(),
    minute: d.getMinutes(),
  }
}

/** ISO storage ← Jalali parts (local wall clock) */
export function jalaliPartsToIso(parts: {
  jy: number
  jm: number
  jd: number
  hour?: number
  minute?: number
}): string {
  const { gy, gm, gd } = jalaali.toGregorian(parts.jy, parts.jm, parts.jd)
  const d = new Date(
    gy,
    gm - 1,
    gd,
    parts.hour ?? 12,
    parts.minute ?? 0,
    0,
    0,
  )
  return d.toISOString()
}

/** Display: ۱۶ مهر ۱۴۰۵ */
export function faDate(iso: string): string {
  try {
    const p = toJalaliParts(iso)
    if (!p) return iso
    return `${faNum(p.jd)} ${jalaliMonthName(p.jm)} ${faNum(p.jy)}`
  } catch {
    try {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }
}

/** Display: ۱۶ مهر ۱۴۰۵، ۱۴:۳۰ */
export function faDateTime(iso: string): string {
  try {
    const p = toJalaliParts(iso)
    if (!p) return iso
    const hh = String(p.hour).padStart(2, '0')
    const mm = String(p.minute).padStart(2, '0')
    return `${faNum(p.jd)} ${jalaliMonthName(p.jm)} ${faNum(p.jy)}، ${faNum(hh)}:${faNum(mm)}`
  } catch {
    return faDate(iso)
  }
}

/**
 * Compact Shamsi for form state: `1405-07-16` (ASCII digits).
 * Storage remains ISO via `jalaliDateValueToIso`.
 */
export function toJalaliDateValue(iso: string): string {
  const p = toJalaliParts(iso)
  if (!p) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${p.jy}-${pad(p.jm)}-${pad(p.jd)}`
}

export function jalaliDateValueToIso(value: string, hour = 12, minute = 0): string {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim())
  if (!m) return new Date().toISOString()
  return jalaliPartsToIso({
    jy: Number(m[1]),
    jm: Number(m[2]),
    jd: Number(m[3]),
    hour,
    minute,
  })
}

/** @deprecated use toJalaliDateValue — kept for datetime local migration */
export function toLocalInput(iso: string): string {
  const p = toJalaliParts(iso)
  if (!p) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${p.jy}-${pad(p.jm)}-${pad(p.jd)}T${pad(p.hour)}:${pad(p.minute)}`
}

export function localInputToIso(value: string): string {
  // Accept Shamsi `YYYY-MM-DDTHH:mm` from our pickers
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2})/.exec(value)
  if (m) {
    return jalaliPartsToIso({
      jy: Number(m[1]),
      jm: Number(m[2]),
      jd: Number(m[3]),
      hour: Number(m[4]),
      minute: Number(m[5]),
    })
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export function trackingCode(): string {
  const part = () => Math.floor(1000 + Math.random() * 9000)
  return `DS-${part()}-${part()}`
}

export function daysInJalaliMonth(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm)
}

export { MONTHS_FA }
