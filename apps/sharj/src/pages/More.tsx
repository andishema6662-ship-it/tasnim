import { Link } from 'react-router-dom'
import { useBuildingFeatures } from '../components/FeatureGate'
import { isFinanceScoped } from '../lib/rbac'
import { useBuildingState, useStore } from '../store/StoreContext'
import type { FeatureModuleId } from '../store/platformTypes'

export function More() {
  const { resetDemo } = useStore()
  const state = useBuildingState()
  const features = useBuildingFeatures()
  const role = state.session?.role
  const isManager = role === 'manager'
  const isFinance = isFinanceScoped(role ?? 'resident')

  type LinkItem = { to: string; label: string; feature?: FeatureModuleId; roles?: string[] }

  const links: LinkItem[] = [
    { to: '/app/qarz', label: 'صندوق قرض‌الحسنه', feature: 'qarz' },
    ...(isManager
      ? [{ to: '/app/block-tickets', label: 'ارجاع مشکل به مدیر شهرک', feature: 'blockTickets' as const }]
      : []),
    ...(!isFinance
      ? [
          { to: '/app/suggestions', label: 'نظرات و پیشنهادات', feature: 'suggestions' as const },
          { to: '/app/meetings', label: 'جلسات، مصوبات و حاضرین', feature: 'meetings' as const },
        ]
      : []),
    { to: '/app/bills', label: 'قبوض و تقسیط شارژ' },
    { to: '/app/payments', label: 'پرداخت‌ها و رسیدها', feature: 'payments' },
    { to: '/app/notifications', label: 'اعلان‌ها و یادآوری' },
    ...(!isFinance
      ? [
          { to: '/app/news', label: 'کانال خبری', feature: 'news' as const },
          { to: '/app/chat', label: 'چت داخلی', feature: 'chat' as const },
          { to: '/app/polls', label: 'نظرسنجی‌ها', feature: 'polls' as const },
        ]
      : []),
    ...(isManager
      ? [
          { to: '/app/residents', label: 'ساکنین' },
          { to: '/app/expenses', label: 'نمای شفافیت (ساکنین)', feature: 'finance' as const },
        ]
      : isFinance
        ? [
            { to: '/app/charges', label: 'زمان‌بندی شارژ', feature: 'charges' as const },
            { to: '/app/finance', label: 'دفتر مالی', feature: 'finance' as const },
            { to: '/app/expenses', label: 'شفافیت هزینه‌ها', feature: 'finance' as const },
            { to: '/app/units', label: 'واحدها (فقط مشاهده)' },
          ]
        : [
            { to: '/app/expenses', label: 'شفافیت هزینه‌ها', feature: 'finance' as const },
            { to: '/app/units', label: 'اطلاعات واحد / پارکینگ' },
            { to: '/app/residents', label: 'ساکنین' },
          ]),
    { to: '/subscription', label: 'پلن اشتراک نرم‌افزار' },
  ]

  const visible = links.filter((l) => !l.feature || features.has(l.feature))

  return (
    <div className="page">
      <h2>بیشتر</h2>
      <p className="lead">
        {isFinance
          ? 'منوی مالی بلوک — امکانات غیرمالی برای این نقش مخفی است.'
          : 'ارتباطات، اعلان‌ها و تنظیمات دمو.'}
      </p>
      <div className="panel">
        <div className="list">
          {visible.map((l) => (
            <Link className="list-item" key={l.to + l.label} to={l.to}>
              <div className="title">{l.label}</div>
              <span className="badge">باز</span>
            </Link>
          ))}
        </div>
      </div>
      {!isFinance && (
        <div className="panel">
          <h3>اتصال‌های آینده</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span className="badge soon">پیامک — به‌زودی</span>
            <span className="badge soon">درگاه پرداخت — به‌زودی</span>
          </div>
        </div>
      )}
      {isManager && (
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={() => {
            if (confirm('داده‌های دمو بازنشانی شود؟')) resetDemo()
          }}
        >
          بازنشانی داده دمو
        </button>
      )}
    </div>
  )
}
