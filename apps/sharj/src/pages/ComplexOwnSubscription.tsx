import { faDate, faNum, toman } from '../lib/format'
import {
  SUB_PERIOD_LABEL,
  SUB_STATUS_LABEL,
  isSubDebt,
  isSubPaid,
} from '../store/platformTypes'
import { useStore } from '../store/StoreContext'

/** Complex manager sees only THEIR platform subscription — not block subs. */
export function ComplexOwnSubscription({ complexId }: { complexId: string }) {
  const { platform } = useStore()
  const complex = platform.admin.complexes.find((c) => c.id === complexId)
  const rows = platform.admin.subscriptionPayments
    .filter((sp) => sp.complexId === complexId && sp.kind === 'complex_platform')
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

  const paid = rows.filter((r) => isSubPaid(r.status))
  const debt = rows.filter((r) => isSubDebt(r.status))
  const paidTotal = paid.reduce((s, r) => s + r.amount, 0)
  const debtTotal = debt.reduce((s, r) => s + r.amount, 0)
  const latest = rows[0]
  const active =
    complex?.subscriptionStatus && isSubPaid(complex.subscriptionStatus)
      ? complex
      : latest && isSubPaid(latest.status)
        ? {
            subscriptionMonths: latest.months,
            subscriptionAmount: latest.amount,
            subscriptionStatus: latest.status,
            subscriptionExpiresAt: complex?.subscriptionExpiresAt,
            subscriptionTracking: latest.trackingCode,
          }
        : null

  return (
    <>
      <p className="lead">
        اشتراک پلتفرم حساب مدیر شهرک — فقط وضعیت پرداختی/بدهی خودتان. گزارش اشتراک بلوک‌ها فقط در پنل
        ادمین کل است.
      </p>

      <div className="stat-row">
        <div className="stat">
          <span className="label">پرداختی‌های تأییدشده</span>
          <span className="value">{toman(paidTotal)}</span>
        </div>
        <div className="stat">
          <span className="label">بدهی / در انتظار</span>
          <span className="value">{toman(debtTotal)}</span>
        </div>
      </div>

      <div className="panel">
        <h3>وضعیت فعلی اشتراک شهرک</h3>
        {active ? (
          <div className="list-item" style={{ paddingTop: 0 }}>
            <div>
              <div className="title">
                دوره{' '}
                {SUB_PERIOD_LABEL[active.subscriptionMonths ?? 12] ??
                  `${faNum(active.subscriptionMonths ?? 12)} ماهه`}
              </div>
              <div className="sub">
                مبلغ: {toman(active.subscriptionAmount ?? 0)}
                <br />
                {active.subscriptionExpiresAt
                  ? `انقضا: ${faDate(active.subscriptionExpiresAt)}`
                  : 'تاریخ انقضا ثبت نشده'}
                <br />
                پیگیری: {active.subscriptionTracking ?? '—'}
              </div>
            </div>
            <span className="badge ok">
              {SUB_STATUS_LABEL[active.subscriptionStatus ?? 'paid_demo']}
            </span>
          </div>
        ) : (
          <div className="empty">اشتراک فعالی ثبت نشده — با ادمین کل هماهنگ کنید.</div>
        )}
      </div>

      <h3 style={{ margin: '8px 0 10px' }}>تاریخچه پرداخت اشتراک شما</h3>
      {rows.map((sp) => (
        <div className="panel" key={sp.id}>
          <div className="list-item" style={{ paddingTop: 0 }}>
            <div>
              <div className="title">
                {toman(sp.amount)} — {SUB_PERIOD_LABEL[sp.months] ?? `${faNum(sp.months)} ماهه`}
              </div>
              <div className="sub">
                تاریخ: <strong>{faDate(sp.createdAt)}</strong>
                <br />
                پیگیری: {sp.trackingCode}
                {sp.receiptNote ? (
                  <>
                    <br />
                    {sp.receiptNote}
                  </>
                ) : null}
              </div>
            </div>
            <span
              className={`badge ${
                isSubPaid(sp.status) ? 'ok' : sp.status === 'pending' ? 'warn' : 'danger'
              }`}
            >
              {SUB_STATUS_LABEL[sp.status]}
            </span>
          </div>
        </div>
      ))}
      {rows.length === 0 && <div className="empty">سند اشتراکی برای این حساب نیست.</div>}
    </>
  )
}
