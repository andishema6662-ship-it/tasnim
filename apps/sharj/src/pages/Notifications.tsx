import { useEffect } from 'react'
import { faDate } from '../lib/format'
import { useStore } from '../store/StoreContext'

const kindLabel = {
  reminder: 'یادآوری',
  payment: 'پرداخت',
  poll: 'نظرسنجی',
  news: 'خبر',
  'sms-stub': 'پیامک',
} as const

export function Notifications() {
  const { state, markNotificationsRead } = useStore()

  useEffect(() => {
    const t = setTimeout(() => markNotificationsRead(), 800)
    return () => clearTimeout(t)
  }, [markNotificationsRead])

  return (
    <div className="page">
      <h2>اعلان‌ها و یادآوری</h2>
      <p className="lead">لیست محلی؛ پیامک و پوش واقعی به‌زودی.</p>
      <div className="panel">
        <div className="list">
          {state.notifications.map((n) => (
            <div className="list-item" key={n.id}>
              <div>
                <div className="title">{n.title}</div>
                <div className="sub">
                  {n.body}
                  <br />
                  {faDate(n.createdAt)}
                </div>
              </div>
              <span className={`badge ${n.kind === 'sms-stub' ? 'soon' : n.read ? '' : 'warn'}`}>
                {kindLabel[n.kind]}
                {n.kind === 'sms-stub' ? ' · به‌زودی' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
