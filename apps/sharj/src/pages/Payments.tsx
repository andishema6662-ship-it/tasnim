import { faDate, toman } from '../lib/format'
import { useStore } from '../store/StoreContext'

export function Payments() {
  const { state } = useStore()
  const session = state.session!
  const payments =
    session.role === 'resident'
      ? state.payments.filter((p) => p.unitId === session.unitId)
      : state.payments

  return (
    <div className="page">
      <h2>پرداخت‌ها</h2>
      <p className="lead">رسیدهای ثبت‌شده با کد پیگیری.</p>
      <div className="panel">
        <div className="list">
          {payments.map((p) => {
            const unit = state.units.find((u) => u.id === p.unitId)
            return (
              <div className="list-item" key={p.id}>
                <div>
                  <div className="title">{toman(p.amount)}</div>
                  <div className="sub">
                    {session.role === 'manager' ? `واحد ${unit?.number} · ` : ''}
                    {p.party === 'owner' ? 'مالک' : 'ساکن'} · {faDate(p.createdAt)}
                    <br />
                    کد پیگیری: {p.trackingCode}
                  </div>
                </div>
                <span className="badge ok">رسید</span>
              </div>
            )
          })}
          {payments.length === 0 && <div className="empty">پرداختی ثبت نشده.</div>}
        </div>
      </div>
    </div>
  )
}
