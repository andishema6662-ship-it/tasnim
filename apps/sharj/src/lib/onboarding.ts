import type { BuildingData, OnboardingStepId } from '../store/types'

export type OnboardingStep = {
  id: OnboardingStepId
  title: string
  hint: string
  to: string
  done: boolean
}

/** Derive manager setup checklist from building data. */
export function managerOnboardingSteps(data: BuildingData): OnboardingStep[] {
  const unitsOk =
    data.units.length > 0 &&
    data.units.every((u) => u.number.trim() && u.residentName.trim() && u.areaSqm > 0)
  const chargesOk = data.schedules.some((s) => s.active)
  const rosterOk =
    data.units.length > 0 &&
    data.units.every((u) => data.residents.some((r) => r.unitId === u.id))
  const inviteOk = Boolean(data.managerOnboarding?.inviteSmsCopied)
  const residentsOk = rosterOk && inviteOk
  const bank = data.blockBankAccount
  const accountOk = Boolean(
    bank?.iban?.trim() &&
      bank?.cardNumber?.trim() &&
      (bank.iban.replace(/\s/g, '').length >= 24) &&
      (bank.cardNumber.replace(/\D/g, '').length === 16),
  )

  return [
    {
      id: 'units',
      title: 'اطلاعات واحدها',
      hint: 'واحدها، متراژ و ساکن را کامل کنید',
      to: '/app/units',
      done: unitsOk,
    },
    {
      id: 'charges',
      title: 'تنظیم شارژ',
      hint: 'حداقل یک زمان‌بندی فعال شارژ',
      to: '/app/charges',
      done: chargesOk,
    },
    {
      id: 'residents',
      title: 'دعوت ساکنین',
      hint: 'کپی پیامک دعوت + ساکنین واحدها',
      to: '/app/residents',
      done: residentsOk,
    },
    {
      id: 'account',
      title: 'حساب بلوک',
      hint: 'ثبت شبا و شماره کارت بانکی',
      to: '/app/block-account',
      done: accountOk,
    },
  ]
}

export function onboardingProgress(steps: OnboardingStep[]) {
  const done = steps.filter((s) => s.done).length
  return { done, total: steps.length, complete: done === steps.length }
}
