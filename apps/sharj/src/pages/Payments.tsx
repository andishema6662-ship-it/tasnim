import { faDate, faDateTime, toman } from '../lib/format'
import { PAYMENT_METHOD_LABEL } from '../store/types'
import { useBuildingState } from '../store/StoreContext'

export function Payments() {
  const state = useBuildingState()
  const session = state.session!
  const payments =
    session.role === 'resident'
      ? state.payments.filter((p) => p.unitId === session.unitId)
      : state.payments

  return (
    <div className="page">
      <h2>پرداخت‌ها</h2>
      <p className="lead">رسیدهای ثبت‌شده با کد پیگیری (شامل زرین‌پال).</p>
      <div className="panel">
        <div className="list">
          {payments.map((p) => {
            const unit = state.units.find((u) => u.id === p.unitId)
            return (
              <div className="list-item" key={p.id}>
                <div>
                  <div className="title">{toman(p.amount)}</div>
                  <div className="sub">
                    {session.role === 'manager' || session.role === 'financeManager'
                      ? `واحد ${unit?.number} · `
                      : ''}
                    {p.party === 'owner' ? 'مالک' : 'ساکن'} ·{' '}
                    {PAYMENT_METHOD_LABEL[p.method] ?? p.method} · {faDate(p.createdAt)}
                    <br />
                    کد پیگیری: {p.trackingCode}
                    {p.authority && (
                      <>
                        <br />
                        Authority: <span dir="ltr">{p.authority}</span>
                      </>
                    )}
                    {p.refId && (
                      <>
                        <br />
                        Ref: {p.refId}
                        {p.cardPan ? ` · کارت ${p.cardPan}` : ''}
                      </>
                    )}
                    {p.verifiedAt && (
                      <>
                        <br />
                        تأیید: {faDateTime(p.verifiedAt)}
                      </>
                    )}
                  </div>
                </div>
                <span className={`badge ${p.gatewayStatus === 'failed' ? 'danger' : 'ok'}`}>
                  {p.method === 'zarinpal' ? 'زرین‌پال' : 'رسید'}
                </span>
              </div>
            )
          })}
          {payments.length === 0 && <div className="empty">پرداختی ثبت نشده.</div>}
        </div>
      </div>
    </div>
  )
}
