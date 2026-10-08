import { Link } from 'react-router-dom'
import { managerOnboardingSteps, onboardingProgress } from '../lib/onboarding'
import { faNum } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'

/** Sticky setup checklist for block/finance managers until complete or dismissed. */
export function OnboardingBanner() {
  const { dismissManagerOnboarding } = useStore()
  const state = useBuildingState()
  const role = state.session.role
  if (role !== 'manager' && role !== 'financeManager') return null
  if (state.managerOnboarding?.dismissed) return null

  const steps = managerOnboardingSteps(state)
  const { done, total, complete } = onboardingProgress(steps)
  if (complete) return null

  const next = steps.find((s) => !s.done)

  return (
    <div className="onboarding-banner" role="region" aria-label="راه‌اندازی اولیه">
      <div className="onboarding-banner__head">
        <div>
          <strong>راه‌اندازی بلوک</strong>
          <span className="sub">
            {' '}
            مرحله {faNum(done + 1)} از {faNum(total)}
            {next ? ` — بعدی: ${next.title}` : ''}
          </span>
        </div>
        <button type="button" className="btn-ghost" onClick={() => dismissManagerOnboarding()}>
          بعداً
        </button>
      </div>
      <div className="onboarding-steps" aria-label="مراحل راه‌اندازی">
        {steps.map((s, i) => (
          <Link
            key={s.id}
            to={s.to}
            className={`onboarding-step ${s.done ? 'done' : next?.id === s.id ? 'current' : ''}`}
          >
            <span className="onboarding-step__n">{s.done ? '✓' : faNum(i + 1)}</span>
            <span className="onboarding-step__body">
              <span className="onboarding-step__title">{s.title}</span>
              <span className="onboarding-step__hint">{s.hint}</span>
            </span>
          </Link>
        ))}
      </div>
      {next && (
        <Link className="btn btn-primary" to={next.to} style={{ width: '100%', marginTop: 10 }}>
          ادامه: {next.title}
        </Link>
      )}
    </div>
  )
}
