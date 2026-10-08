import { useState } from 'react'
import { formulaLabel } from '../lib/charges'
import { faDate, toman } from '../lib/format'
import { useStore } from '../store/StoreContext'
import type { DebtParty } from '../store/types'

export function Bills() {
  const { state, payBill } = useStore()
  const [toast, setToast] = useState<string | null>(null)
  const session = state.session!
  const bills =
    session.role === 'resident'
      ? state.bills.filter((b) => b.unitId === session.unitId)
      : state.bills

  const pay = (billId: string, party: DebtParty) => {
    const code = payBill(billId, party)
    if (code) {
      setToast(`پرداخت دمو موفق — رسید با کد ${code} ثبت شد. درگاه واقعی به‌زودی.`)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <div className="page">
      <h2>شارژ و قبوض</h2>
      <p className="lead">تفکیک بدهی مالک و ساکن؛ پرداخت آنلاین دمو با رسید خودکار.</p>
      <div className="list">
        {bills.map((b) => {
          const unit = state.units.find((u) => u.id === b.unitId)
          const ownerDue = Math.max(0, b.ownerShare - b.paidOwner)
          const residentDue = Math.max(0, b.residentShare - b.paidResident)
          const paidPct = Math.round(((b.paidOwner + b.paidResident) / b.total) * 100)
          return (
            <div className="panel" key={b.id}>
              <div className="list-item" style={{ paddingTop: 0 }}>
                <div>
                  <div className="title">
                    {session.role === 'manager' ? `واحد ${unit?.number} — ` : ''}
                    {b.title}
                  </div>
                  <div className="sub">
                    {b.periodLabel} · {formulaLabel[b.formula]} · {faDate(b.createdAt)}
                    <br />
                    کل: {toman(b.total)}
                  </div>
                </div>
                <span
                  className={`badge ${
                    b.status === 'paid' ? 'ok' : b.status === 'partial' ? 'warn' : 'danger'
                  }`}
                >
                  {b.status === 'paid' ? 'پرداخت‌شده' : b.status === 'partial' ? 'ناقص' : 'باز'}
                </span>
              </div>
              <div className="progress">
                <i style={{ width: `${paidPct}%` }} />
              </div>
              <div className="sub" style={{ marginTop: 10 }}>
                سهم مالک: {toman(b.ownerShare)} (مانده {toman(ownerDue)})
                <br />
                سهم ساکن: {toman(b.residentShare)} (مانده {toman(residentDue)})
              </div>
              {b.status !== 'paid' && (
                <div className="grid-actions" style={{ marginTop: 12 }}>
                  {ownerDue > 0 && (
                    <button type="button" className="btn btn-primary" onClick={() => pay(b.id, 'owner')}>
                      پرداخت سهم مالک
                    </button>
                  )}
                  {residentDue > 0 && (
                    <button type="button" className="btn btn-copper" onClick={() => pay(b.id, 'resident')}>
                      پرداخت سهم ساکن
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {bills.length === 0 && <div className="empty">قبضی ثبت نشده.</div>}
      </div>
      <div className="panel">
        <h3>درگاه پرداخت</h3>
        <p className="sub" style={{ margin: '0 0 8px' }}>
          پرداخت فعلی شبیه‌سازی محلی است و رسید + کد پیگیری می‌سازد.
        </p>
        <span className="badge soon">درگاه بانکی — به‌زودی</span>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
