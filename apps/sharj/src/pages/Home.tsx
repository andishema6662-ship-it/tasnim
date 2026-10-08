import { Link } from 'react-router-dom'
import { RequireFeature, useBuildingFeatures } from '../components/FeatureGate'
import { roleLabel } from '../lib/rbac'
import { toman } from '../lib/format'
import { useBuildingState } from '../store/StoreContext'

export function Home() {
  const state = useBuildingState()
  const session = state.session!
  const features = useBuildingFeatures()
  const unpaid = state.bills.filter((b) => b.status !== 'paid')
  const myBills =
    session.role === 'resident'
      ? unpaid.filter((b) => b.unitId === session.unitId)
      : unpaid
  const myDebt =
    session.role === 'resident'
      ? state.units.find((u) => u.id === session.unitId)?.balance ?? 0
      : state.units.reduce((s, u) => s + Math.min(0, u.balance), 0)

  if (session.role === 'manager' || session.role === 'financeManager') {
    const isFinance = session.role === 'financeManager'
    return (
      <div className="page">
        <h2>{isFinance ? 'میز کار مالی' : 'میز کار مدیر'}</h2>
        <p className="lead">
          {isFinance
            ? 'شارژ، قبوض، صندوق و گزارش مالی — بدون تنظیمات کامل ساختمان.'
            : 'شارژ دوره‌ای، بیلان صندوق و پیگیری بدهی واحدها.'}
        </p>
        <div className="badge" style={{ marginBottom: 10 }}>
          {roleLabel[session.role]}
        </div>
        <div className="stat-row">
          <div className="stat">
            <span className="label">مانده صندوق</span>
            <span className="value">{toman(state.fundBalance)}</span>
          </div>
          <div className="stat">
            <span className="label">جمع بدهی واحدها</span>
            <span className="value">{toman(Math.abs(myDebt))}</span>
          </div>
        </div>
        <div className="quick-grid">
          {features.has('charges') && (
            <Link className="quick-link" to="/app/charges">
              <strong>شارژ</strong>
              <span>فرمول و زمان‌بندی</span>
            </Link>
          )}
          {features.has('finance') && (
            <Link className="quick-link" to="/app/finance">
              <strong>مالی</strong>
              <span>هزینه و درآمد</span>
            </Link>
          )}
          {!isFinance && features.has('meetings') && (
            <Link className="quick-link" to="/app/meetings">
              <strong>جلسات</strong>
              <span>مصوبات و حاضرین</span>
            </Link>
          )}
          {features.has('qarz') && (
            <Link className="quick-link" to="/app/qarz">
              <strong>قرض‌الحسنه</strong>
              <span>{isFinance ? 'پرداخت و گزارش' : 'صندوق اعضا'}</span>
            </Link>
          )}
          <Link className="quick-link" to="/app/bills">
            <strong>قبوض</strong>
            <span>پرداخت و تقسیط</span>
          </Link>
        </div>
        <div className="panel">
          <h3>قبوض باز</h3>
          <div className="list">
            {myBills.slice(0, 4).map((b) => {
              const unit = state.units.find((u) => u.id === b.unitId)
              return (
                <div className="list-item" key={b.id}>
                  <div>
                    <div className="title">
                      واحد {unit?.number} — {b.title}
                    </div>
                    <div className="sub">{toman(b.total - b.paidOwner - b.paidResident)} مانده</div>
                  </div>
                  <span className={`badge ${b.status === 'partial' ? 'warn' : 'danger'}`}>
                    {b.status === 'partial' ? 'ناقص' : 'پرداخت‌نشده'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const unit = state.units.find((u) => u.id === session.unitId)!
  return (
    <div className="page">
      <h2>واحد {unit.number}</h2>
      <p className="lead">صورت‌حساب، پرداخت یک‌کلیکی و شفافیت هزینه‌ها.</p>
      <div className="stat-row">
        <div className="stat">
          <span className="label">بدهی / بستانکاری</span>
          <span className="value">{toman(unit.balance)}</span>
        </div>
        <div className="stat">
          <span className="label">قبوض باز</span>
          <span className="value">{myBills.length}</span>
        </div>
      </div>
      <div className="quick-grid">
        <Link className="quick-link" to="/app/bills">
          <strong>پرداخت</strong>
          <span>شارژ آنلاین</span>
        </Link>
        <RequireFeature id="finance">
          <Link className="quick-link" to="/app/expenses">
            <strong>هزینه‌ها</strong>
            <span>شفافیت مالی</span>
          </Link>
        </RequireFeature>
        <RequireFeature id="polls">
          <Link className="quick-link" to="/app/polls">
            <strong>نظرسنجی</strong>
            <span>مشارکت</span>
          </Link>
        </RequireFeature>
        <RequireFeature id="qarz">
          <Link className="quick-link" to="/app/qarz">
            <strong>قرض‌الحسنه</strong>
            <span>صندوق و اقساط</span>
          </Link>
        </RequireFeature>
      </div>
      <div className="panel">
        <h3>نزدیک‌ترین قبض</h3>
        {myBills[0] ? (
          <div className="list-item">
            <div>
              <div className="title">{myBills[0].title}</div>
              <div className="sub">
                سهم ساکن {toman(myBills[0].residentShare - myBills[0].paidResident)} · سهم مالک{' '}
                {toman(myBills[0].ownerShare - myBills[0].paidOwner)}
              </div>
            </div>
            <Link className="btn btn-copper" to="/app/bills" style={{ padding: '8px 12px', minHeight: 40 }}>
              پرداخت
            </Link>
          </div>
        ) : (
          <div className="empty">قبض بازی نیست.</div>
        )}
      </div>
    </div>
  )
}
