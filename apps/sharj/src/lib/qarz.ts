import type {
  QarzApprovalThreshold,
  QarzFund,
  QarzMemberDue,
  QarzMemberVote,
} from '../store/types'

/** Round toman amounts to nearest 1000 for cleaner monthly dues */
export function computeMonthlyPerUnit(
  totalAmount: number,
  memberCount: number,
  periodMonths: number,
): number {
  const denom = Math.max(1, memberCount) * Math.max(1, periodMonths)
  const raw = totalAmount / denom
  return Math.max(1000, Math.round(raw / 1000) * 1000)
}

export function impliedTotal(
  monthlyPerUnit: number,
  memberCount: number,
  periodMonths: number,
): number {
  return monthlyPerUnit * Math.max(1, memberCount) * Math.max(1, periodMonths)
}

export function approvalProgress(fund: QarzFund): {
  yes: number
  no: number
  pending: number
  total: number
  passed: boolean
} {
  const total = fund.votes.length
  const yes = fund.votes.filter((v) => v.approved === true).length
  const no = fund.votes.filter((v) => v.approved === false).length
  const pending = fund.votes.filter((v) => v.approved === null).length
  const passed =
    fund.approvalThreshold === 'unanimous'
      ? total > 0 && yes === total
      : total > 0 && yes > total / 2
  return { yes, no, pending, total, passed }
}

export function buildVotes(unitIds: string[]): QarzMemberVote[] {
  return unitIds.map((unitId) => ({ unitId, approved: null }))
}

export function buildDues(
  unitIds: string[],
  monthlyPerUnit: number,
  periodMonths: number,
  startIso: string,
): QarzMemberDue[] {
  const start = new Date(startIso)
  if (Number.isNaN(start.getTime())) start.setTime(Date.now())
  const dues: QarzMemberDue[] = []
  const months = Math.max(1, periodMonths)
  for (const unitId of unitIds) {
    for (let m = 1; m <= months; m++) {
      const due = new Date(start)
      due.setMonth(due.getMonth() + (m - 1))
      dues.push({
        id: `qd-${unitId}-m${m}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        unitId,
        monthIndex: m,
        amount: monthlyPerUnit,
        dueAt: due.toISOString(),
        paidAmount: 0,
        status: 'unpaid',
      })
    }
  }
  return dues
}

export function fundReceived(fund: QarzFund): number {
  return fund.payments.reduce((s, p) => s + p.amount, 0)
}

export function fundDebt(fund: QarzFund): number {
  return fund.dues.reduce((s, d) => s + Math.max(0, d.amount - d.paidAmount), 0)
}

export function unitDebt(fund: QarzFund, unitId: string): number {
  return fund.dues
    .filter((d) => d.unitId === unitId)
    .reduce((s, d) => s + Math.max(0, d.amount - d.paidAmount), 0)
}

export function unitPaid(fund: QarzFund, unitId: string): number {
  return fund.payments.filter((p) => p.unitId === unitId).reduce((s, p) => s + p.amount, 0)
}

export const qarzStatusLabel: Record<QarzFund['status'], string> = {
  draft: 'پیش‌نویس',
  awaiting_approval: 'در انتظار تأیید اعضا',
  active: 'فعال',
  completed: 'تکمیل‌شده',
  closed: 'بسته‌شده',
}

export const thresholdLabel: Record<QarzApprovalThreshold, string> = {
  majority: 'اکثریت واحدها (بیش از نصف)',
  unanimous: 'اتفاق آرا (همه واحدها)',
}
