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
  const hasCharge = (data.funds ?? []).some((f) => f.kind === 'charge')
  const hasOperating = (data.funds ?? []).some((f) => f.kind === 'operating')
  const accountOk =
    hasCharge && hasOperating && Boolean(data.managerOnboarding?.accountConfirmed)

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
      hint: 'صندوق شارژ و هزینه‌های جاری',
      to: '/app/finance?tab=status',
      done: accountOk,
    },
  ]
}

export function onboardingProgress(steps: OnboardingStep[]) {
  const done = steps.filter((s) => s.done).length
  return { done, total: steps.length, complete: done === steps.length }
}
