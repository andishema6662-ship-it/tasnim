import { jalaliMonthName, toJalaliParts } from './format'
import type { BuildingData } from '../store/types'

export type MonthCashflow = {
  key: string
  jy: number
  jm: number
  /** Short Jalali month label, e.g. مهر */
  label: string
  /** دریافتی‌ها — unit payments */
  receipts: number
  /** هزینه‌ها — ledger expenses */
  expenses: number
}

/** Last `count` Jalali months (oldest → newest), including empty months. */
export function lastJalaliMonthKeys(
  count: number,
  from = new Date(),
): { jy: number; jm: number; key: string }[] {
  const parts = toJalaliParts(from.toISOString()) ?? { jy: 1404, jm: 1, jd: 1, hour: 0, minute: 0 }
  const out: { jy: number; jm: number; key: string }[] = []
  let y = parts.jy
  let m = parts.jm
  for (let i = 0; i < count; i++) {
    out.unshift({ jy: y, jm: m, key: `${y}-${m}` })
    m -= 1
    if (m < 1) {
      m = 12
      y -= 1
    }
  }
  return out
}

/**
 * Monthly cashflow for manager dashboard:
 * - receipts = sum of Payment.amount by Jalali month
 * - expenses = sum of ledger expense amounts by Jalali month
 */
export function monthlyReceiptsVsExpenses(
  data: BuildingData,
  monthCount = 6,
): MonthCashflow[] {
  const months = lastJalaliMonthKeys(monthCount)
  const map = new Map(
    months.map((m) => [
      m.key,
      {
        key: m.key,
        jy: m.jy,
        jm: m.jm,
        label: jalaliMonthName(m.jm),
        receipts: 0,
        expenses: 0,
      } satisfies MonthCashflow,
    ]),
  )

  for (const p of data.payments ?? []) {
    const parts = toJalaliParts(p.createdAt)
    if (!parts) continue
    const row = map.get(`${parts.jy}-${parts.jm}`)
    if (row) row.receipts += p.amount
  }

  for (const e of data.ledger ?? []) {
    if (e.kind !== 'expense') continue
    const parts = toJalaliParts(e.createdAt)
    if (!parts) continue
    const row = map.get(`${parts.jy}-${parts.jm}`)
    if (row) row.expenses += e.amount
  }

  return months.map((m) => map.get(m.key)!)
}
