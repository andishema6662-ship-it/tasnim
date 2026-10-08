import type { Bill, Installment } from '../store/types'

export function billRemaining(bill: Bill): number {
  return Math.max(0, bill.total - bill.paidOwner - bill.paidResident)
}

export function previewInstallments(
  remaining: number,
  count: number,
  startDate: string,
  intervalMonths = 1,
): Omit<Installment, 'id' | 'status' | 'paidAt' | 'paymentId'>[] {
  const n = Math.min(12, Math.max(2, Math.floor(count)))
  const base = Math.floor(remaining / n)
  const parts: number[] = Array.from({ length: n }, () => base)
  let leftover = remaining - base * n
  for (let i = 0; i < leftover; i++) parts[i] += 1

  const start = new Date(startDate)
  if (Number.isNaN(start.getTime())) {
    start.setTime(Date.now())
  }

  return parts.map((amount, i) => {
    const due = new Date(start)
    due.setMonth(due.getMonth() + i * intervalMonths)
    return {
      index: i + 1,
      amount,
      dueAt: due.toISOString(),
    }
  })
}

export function buildInstallments(
  remaining: number,
  count: number,
  startDate: string,
  intervalMonths = 1,
): Installment[] {
  return previewInstallments(remaining, count, startDate, intervalMonths).map((p, i) => ({
    ...p,
    id: `inst-${Date.now()}-${i}`,
    status: 'unpaid' as const,
  }))
}
