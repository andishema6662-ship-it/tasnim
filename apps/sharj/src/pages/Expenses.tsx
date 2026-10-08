import { faDate, toman } from '../lib/format'
import { useBuildingState } from '../store/StoreContext'

export function Expenses() {
  const state = useBuildingState()
  const visible = state.ledger.filter((e) => e.visibleToResidents)
  const expenseTotal = visible.filter((e) => e.kind === 'expense').reduce((s, e) => s + e.amount, 0)
  const incomeTotal = visible.filter((e) => e.kind === 'income').reduce((s, e) => s + e.amount, 0)

  return (
    <div className="page">
      <h2>شفافیت هزینه‌ها</h2>
      <p className="lead">ببینید شارژ پرداختی صرف چه مواردی در ساختمان می‌شود.</p>
      <div className="stat-row">
        <div className="stat">
          <span className="label">هزینه‌های شفاف</span>
          <span className="value">{toman(expenseTotal)}</span>
        </div>
        <div className="stat">
          <span className="label">درآمدهای شفاف</span>
          <span className="value">{toman(incomeTotal)}</span>
        </div>
      </div>
      <div className="panel">
        <div className="list">
          {visible.map((e) => (
            <div className="list-item" key={e.id}>
              <div>
                <div className="title">{e.title}</div>
                <div className="sub">
                  {e.category}
                  {e.note ? ` · ${e.note}` : ''}
                  <br />
                  {faDate(e.createdAt)}
                </div>
              </div>
              <span className={`badge ${e.kind === 'income' ? 'ok' : 'warn'}`}>
                {e.kind === 'income' ? 'درآمد' : 'هزینه'} {toman(e.amount)}
              </span>
            </div>
          ))}
          {visible.length === 0 && <div className="empty">موردی برای نمایش نیست.</div>}
        </div>
      </div>
    </div>
  )
}
