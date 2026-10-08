import { jalaliMonthName, toJalaliParts } from './format'
import { isSubPaid, type ComplexLedgerEntry, type SubscriptionPayment } from '../store/platformTypes'
import type { BuildingData, PlatformState } from '../store/types'

export type MonthCashflow = {
  key: string
  jy: number
  jm: number
  /** Short Jalali month label, e.g. مهر */
  label: string
  /** Series A (دریافتی / درآمد / تأییدشده) */
  receipts: number
  /** Series B (هزینه / در انتظار) */
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

function emptyMonthMap(monthCount: number) {
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
  return { months, map }
}

/**
 * Building cashflow:
 * - receipts = unit payments
 * - expenses = ledger expenses
 */
export function monthlyReceiptsVsExpenses(
  data: BuildingData,
  monthCount = 6,
): MonthCashflow[] {
  const { months, map } = emptyMonthMap(monthCount)

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

/**
 * Complex manager: aggregate block buildings' payments/expenses
 * plus complexLedger income/expense for the complex.
 */
export function complexMonthlyCashflow(
  platform: PlatformState,
  complexId: string,
  monthCount = 6,
): MonthCashflow[] {
  const complex = platform.admin.complexes.find((c) => c.id === complexId)
  const blockIds = complex?.blockIds ?? []
  const { months, map } = emptyMonthMap(monthCount)

  for (const bid of blockIds) {
    const data = platform.byId[bid]
    if (!data) continue
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
  }

  const ledger: ComplexLedgerEntry[] = (platform.admin.complexLedger ?? []).filter(
    (e) => e.complexId === complexId,
  )
  for (const e of ledger) {
    const parts = toJalaliParts(e.at)
    if (!parts) continue
    const row = map.get(`${parts.jy}-${parts.jm}`)
    if (!row) continue
    if (e.kind === 'income') row.receipts += e.amount
    else row.expenses += e.amount
  }

  return months.map((m) => map.get(m.key)!)
}

/**
 * Site admin: subscription revenue by Jalali month.
 * - receipts = paid (approved / paid_demo)
 * - expenses = pending (awaiting review)
 */
export function adminMonthlySubscriptionSeries(
  payments: SubscriptionPayment[],
  monthCount = 6,
): MonthCashflow[] {
  const { months, map } = emptyMonthMap(monthCount)

  for (const p of payments ?? []) {
    const parts = toJalaliParts(p.createdAt)
    if (!parts) continue
    const row = map.get(`${parts.jy}-${parts.jm}`)
    if (!row) continue
    if (isSubPaid(p.status)) row.receipts += p.amount
    else if (p.status === 'pending') row.expenses += p.amount
  }

  return months.map((m) => map.get(m.key)!)
}
