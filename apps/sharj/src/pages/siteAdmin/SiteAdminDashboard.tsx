import { useMemo } from 'react'
import { GroupedBarChart } from '../../components/GroupedBarChart'
import { adminMonthlySubscriptionSeries } from '../../lib/financeChart'
import { faDate, faNum, toman } from '../../lib/format'
import { isSubPaid } from '../../store/platformTypes'
import type { SiteAdminSection } from '../../store/platformTypes'
import { useStore } from '../../store/StoreContext'

export function SiteAdminDashboard({
  onNavigate,
}: {
  onNavigate: (section: SiteAdminSection) => void
}) {
  const { platform } = useStore()
  const paidSubs = platform.admin.subscriptionPayments.filter((s) => isSubPaid(s.status))
  const pendingSubs = platform.admin.subscriptionPayments.filter((s) => s.status === 'pending')
  const totalPaid = paidSubs.reduce((a, s) => a + s.amount, 0)
  const openSupport = (platform.admin.supportTickets ?? []).filter(
    (t) => t.status === 'open' || t.status === 'pending',
  ).length
  const customers =
    platform.buildings.reduce((n, b) => n + (platform.byId[b.id]?.units.length ?? 0), 0) +
    platform.admin.complexes.length

  const subMonths = useMemo(
    () => adminMonthlySubscriptionSeries(platform.admin.subscriptionPayments, 6),
    [platform.admin.subscriptionPayments],
  )

  const shortcuts: { id: SiteAdminSection; label: string; hint: string }[] = [
    { id: 'properties', label: 'املاک', hint: `${faNum(platform.buildings.length)} ملک` },
    { id: 'users', label: 'کاربران', hint: `${faNum(platform.admin.users.length)} نفر` },
    { id: 'finance', label: 'مالی', hint: toman(totalPaid) },
    { id: 'support', label: 'پشتیبانی', hint: `${faNum(openSupport)} باز` },
    { id: 'qarz', label: 'قرض‌الحسنه', hint: 'ایجاد مرکزی' },
    { id: 'changelog', label: 'بروزرسانی‌ها', hint: 'گزارش نسخه‌ها' },
  ]

  return (
    <div className="sa-dashboard">
      <div className="sa-hero">
        <div>
          <p className="sa-hero__eyebrow">پیشخوان ادمین کل</p>
          <h3 className="sa-hero__title">سلام، مدیریت پلتفرم دیارشارژ</h3>
          <p className="sa-hero__lead">
            نمای کلی املاک، اشتراک‌ها، پشتیبانی و جریان مالی — از اینجا به هر بخش بروید.
          </p>
        </div>
        <div className="sa-hero__pulse" aria-hidden />
      </div>

      <div className="sa-kpi-grid">
        <div className="sa-kpi">
          <span className="sa-kpi__label">شهرک‌ها</span>
          <span className="sa-kpi__value">{faNum(platform.admin.complexes.length)}</span>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi__label">املاک / بلوک‌ها</span>
          <span className="sa-kpi__value">{faNum(platform.buildings.length)}</span>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi__label">مشتریان (واحد+شهرک)</span>
          <span className="sa-kpi__value">{faNum(customers)}</span>
        </div>
        <div className="sa-kpi sa-kpi--accent">
          <span className="sa-kpi__label">جمع واریزی تأییدشده</span>
          <span className="sa-kpi__value sa-kpi__value--sm">{toman(totalPaid)}</span>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi__label">فیش در انتظار</span>
          <span className="sa-kpi__value">{faNum(pendingSubs.length)}</span>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi__label">تیکت پشتیبانی باز</span>
          <span className="sa-kpi__value">{faNum(openSupport)}</span>
        </div>
      </div>

      <div className="panel dash-chart-panel">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>نمودار میله‌ای — اشتراک ۶ ماه</h3>
          <button type="button" className="btn-ghost" onClick={() => onNavigate('finance')}>
            مالی
          </button>
        </div>
        <p className="sub" style={{ marginTop: 0 }}>
          مبلغ اشتراک تأییدشده در برابر فیش‌های در انتظار — ماه شمسی.
        </p>
        <GroupedBarChart
          months={subMonths}
          seriesALabel="تأییدشده"
          seriesBLabel="در انتظار"
        />
      </div>

      <h3 className="sa-section-title">میان‌برها</h3>
      <div className="sa-shortcut-grid">
        {shortcuts.map((s) => (
          <button
            key={s.id}
            type="button"
            className="sa-shortcut"
            onClick={() => onNavigate(s.id)}
          >
            <span className="sa-shortcut__label">{s.label}</span>
            <span className="sa-shortcut__hint">{s.hint}</span>
          </button>
        ))}
      </div>

      <div className="sa-dash-split">
        <div className="panel">
          <h3>آخرین فعالیت‌ها</h3>
          <div className="list">
            {platform.admin.activity.slice(0, 6).map((a) => (
              <div className="list-item" key={a.id}>
                <div>
                  <div className="title">{a.label}</div>
                  <div className="sub">
                    {a.kind} · {faDate(a.at)}
                  </div>
                </div>
              </div>
            ))}
            {platform.admin.activity.length === 0 && (
              <div className="empty">رویدادی ثبت نشده.</div>
            )}
          </div>
        </div>
        <div className="panel">
          <h3>آخرین بروزرسانی‌ها</h3>
          <div className="list">
            {(platform.admin.changelog ?? []).slice(0, 4).map((c) => (
              <div className="list-item" key={c.id}>
                <div>
                  <div className="title">
                    {c.version} — {c.title}
                  </div>
                  <div className="sub">{faDate(c.at)}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 10 }}
            onClick={() => onNavigate('changelog')}
          >
            مشاهده گزارش کامل
          </button>
        </div>
      </div>
    </div>
  )
}
