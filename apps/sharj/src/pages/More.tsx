import { Link } from 'react-router-dom'
import { useBuildingState, useStore } from '../store/StoreContext'

export function More() {
  const { resetDemo } = useStore()
  const state = useBuildingState()
  const isManager = state.session?.role === 'manager'

  const links = [
    { to: '/app/suggestions', label: 'نظرات و پیشنهادات' },
    { to: '/app/meetings', label: 'جلسات، مصوبات و حاضرین' },
    { to: '/app/bills', label: 'قبوض و تقسیط شارژ' },
    { to: '/app/payments', label: 'پرداخت‌ها و رسیدها' },
    { to: '/app/notifications', label: 'اعلان‌ها و یادآوری' },
    { to: '/app/news', label: 'کانال خبری' },
    { to: '/app/chat', label: 'چت داخلی' },
    { to: '/app/polls', label: 'نظرسنجی‌ها' },
    ...(isManager
      ? [
          { to: '/app/residents', label: 'ساکنین' },
          { to: '/app/expenses', label: 'نمای شفافیت (ساکنین)' },
        ]
      : [
          { to: '/app/expenses', label: 'شفافیت هزینه‌ها' },
          { to: '/app/units', label: 'اطلاعات واحد / پارکینگ' },
          { to: '/app/residents', label: 'ساکنین' },
        ]),
    { to: '/subscription', label: 'پلن اشتراک نرم‌افزار' },
  ]

  return (
    <div className="page">
      <h2>بیشتر</h2>
      <p className="lead">ارتباطات، اعلان‌ها و تنظیمات دمو.</p>
      <div className="panel">
        <div className="list">
          {links.map((l) => (
            <Link className="list-item" key={l.to} to={l.to}>
              <div className="title">{l.label}</div>
              <span className="badge">باز</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="panel">
        <h3>اتصال‌های آینده</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span className="badge soon">پیامک — به‌زودی</span>
          <span className="badge soon">درگاه پرداخت — به‌زودی</span>
          <span className="badge soon">ورود/خروج مشاعات — به‌زودی</span>
        </div>
      </div>
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
    </div>
  )
}
