import { Link } from 'react-router-dom'
import { useBuildingFeatures } from '../components/FeatureGate'
import { isFinanceScoped, menuAccessFor, roleAllowsPath, type MenuAccess } from '../lib/rbac'
import { useBuildingState, useStore } from '../store/StoreContext'
import type { FeatureModuleId } from '../store/platformTypes'
import type { Role } from '../store/types'

const ACCESS_BADGE: Record<
  MenuAccess,
  { label: string; className: string }
> = {
  open: { label: 'باز', className: 'badge ok' },
  needs_activation: { label: 'نیاز به فعال‌سازی', className: 'badge warn' },
  role_locked: { label: 'قفل', className: 'badge soon' },
}

export function More() {
  const { resetDemo } = useStore()
  const state = useBuildingState()
  const features = useBuildingFeatures()
  const role = (state.session?.role ?? 'resident') as Role
  const isManager = role === 'manager'
  const isFinance = isFinanceScoped(role)

  type LinkItem = { to: string; label: string; feature?: FeatureModuleId; group?: string }

  const opsLinks: LinkItem[] = [
    ...(isManager || isFinance
      ? [
          { to: '/app/reminders', label: 'یادآوری‌ها', group: 'ops' },
          { to: '/app/services', label: 'امور خدماتی', group: 'ops' },
          {
            to: '/app/finance?tab=status',
            label: 'مالی — صورت وضعیت و صندوق‌ها',
            feature: 'finance' as const,
            group: 'ops',
          },
        ]
      : [{ to: '/app/services', label: 'امور خدماتی', group: 'ops' }]),
  ]

  const links: LinkItem[] = [
    ...opsLinks,
    { to: '/app/qarz', label: 'صندوق قرض‌الحسنه', feature: 'qarz' },
    { to: '/app/programs', label: 'برنامه‌های جانبی شهرک/بلوک' },
    ...(isManager
      ? [
          { to: '/app/broadcasts', label: 'پیام مدیر به واحدها' },
          { to: '/app/site-proposals', label: 'پیشنهاد به ادمین کل سایت' },
          {
            to: '/app/block-tickets',
            label: 'ارجاع مشکل به مدیر شهرک',
            feature: 'blockTickets' as const,
          },
        ]
      : []),
    ...(!isFinance
      ? [
          { to: '/app/suggestions', label: 'نظرات و پیشنهادات', feature: 'suggestions' as const },
          { to: '/app/meetings', label: 'جلسات، مصوبات و حاضرین', feature: 'meetings' as const },
        ]
      : []),
    { to: '/app/bills', label: 'قبوض و تقسیط شارژ' },
    { to: '/app/payments', label: 'پرداخت‌ها و رسیدها', feature: 'payments' },
    { to: '/app/notifications', label: 'اعلان‌ها' },
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

  // Same source of truth as RoleGate + FeatureGate — never show «باز» if click would deny
  const catalog = links
    .map((l) => ({
      ...l,
      access: menuAccessFor(role, l.to.split('?')[0], l.feature, features),
    }))
    // Hide role-locked items entirely (wrong role); keep activation-needed visible with CTA
    .filter((l) => l.access !== 'role_locked')

  const openItems = catalog.filter((l) => l.access === 'open')
  const lockedItems = catalog.filter((l) => l.access === 'needs_activation')
  const canActivate = isManager || role === 'complexManager' || role === 'siteAdmin'
  const opsOpen = openItems.filter((l) => l.group === 'ops')
  const otherOpen = openItems.filter((l) => l.group !== 'ops')

  return (
    <div className="page">
      <h2>تنظیمات</h2>
      <p className="lead">
        {isFinance
          ? 'تنظیمات مالی بلوک — امکانات غیرمالی برای این نقش مخفی است.'
          : 'عملیات بلوک، یادآوری، خدمات و دسترسی به بخش‌های اپ.'}
      </p>

      {opsOpen.length > 0 && (
        <div className="panel">
          <h3>عملیات بلوک</h3>
          <div className="list">
            {opsOpen.map((l) => {
              const badge = ACCESS_BADGE.open
              return (
                <Link className="list-item" key={l.to + l.label} to={l.to}>
                  <div className="title">{l.label}</div>
                  <span className={badge.className}>{badge.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="panel">
        <h3>منوی تنظیمات</h3>
        <div className="list">
          {otherOpen.map((l) => {
            const badge = ACCESS_BADGE.open
            return (
              <Link className="list-item" key={l.to + l.label} to={l.to}>
                <div className="title">{l.label}</div>
                <span className={badge.className}>{badge.label}</span>
              </Link>
            )
          })}
          {otherOpen.length === 0 && <div className="empty">مورد بازی نیست.</div>}
        </div>
      </div>
      {lockedItems.length > 0 && (
        <div className="panel">
          <h3>امکانات نیازمند فعال‌سازی</h3>
          <div className="list">
            {lockedItems.map((l) => {
              const badge = ACCESS_BADGE.needs_activation
              return (
                <div className="list-item" key={`lock-${l.to}`}>
                  <div>
                    <div className="title">{l.label}</div>
                    <div className="sub">
                      {roleAllowsPath(role, l.to.split('?')[0])
                        ? 'برای این ساختمان فعال نیست.'
                        : 'نقش شما به این بخش دسترسی ندارد.'}
                    </div>
                  </div>
                  {canActivate && l.feature ? (
                    <Link
                      className="btn btn-copper"
                      to={`/app/activate/${l.feature}?buildingId=${encodeURIComponent(state.buildingId)}`}
                    >
                      فعال‌سازی
                    </Link>
                  ) : (
                    <span className={badge.className}>{badge.label}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
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
