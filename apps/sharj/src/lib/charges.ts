import type { ChargeFormula, ChargeSchedule, Unit } from '../store/types'

export function computeUnitCharge(unit: Unit, schedule: ChargeSchedule, consumptionHint = 0): number {
  switch (schedule.formula) {
    case 'fixed':
      return schedule.amountOrRate
    case 'area':
      return Math.round(schedule.amountOrRate * unit.areaSqm)
    case 'perPerson':
      return Math.round(schedule.amountOrRate * unit.occupants)
    case 'consumption':
      return Math.round(schedule.amountOrRate * (consumptionHint || unit.occupants * 12))
    default:
      return 0
  }
}

export const formulaLabel: Record<ChargeFormula, string> = {
  fixed: 'ثابت',
  area: 'متراژی',
  perPerson: 'نفری',
  consumption: 'مصرفی',
}

export const periodLabel = {
  monthly: 'ماهانه',
  seasonal: 'فصلی',
} as const
