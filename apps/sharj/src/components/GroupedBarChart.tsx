import { faNum, toman } from '../lib/format'
import type { MonthCashflow } from '../lib/financeChart'

const RECEIPT_COLOR = 'var(--mint, #1f8a5b)'
const EXPENSE_COLOR = 'var(--copper, #c4784a)'

/** Vertical grouped bar chart — دریافتی vs هزینه per Jalali month. */
export function GroupedBarChart({
  months,
  height = 168,
}: {
  months: MonthCashflow[]
  height?: number
}) {
  if (months.length === 0) return <div className="empty">داده‌ای نیست.</div>

  const max = Math.max(1, ...months.flatMap((m) => [m.receipts, m.expenses]))

  return (
    <div className="col-chart" aria-label="نمودار میله‌ای دریافتی و هزینه">
      <div className="col-chart__plot" style={{ height }}>
        {months.map((m) => {
          const rPct = Math.round((m.receipts / max) * 100)
          const ePct = Math.round((m.expenses / max) * 100)
          return (
            <div className="col-chart__group" key={m.key}>
              <div className="col-chart__bars">
                <div
                  className="col-chart__bar col-chart__bar--receipt"
                  style={{ height: `${Math.max(rPct, m.receipts > 0 ? 4 : 0)}%` }}
                  title={`دریافتی ${toman(m.receipts)}`}
                />
                <div
                  className="col-chart__bar col-chart__bar--expense"
                  style={{ height: `${Math.max(ePct, m.expenses > 0 ? 4 : 0)}%` }}
                  title={`هزینه ${toman(m.expenses)}`}
                />
              </div>
              <span className="col-chart__xlabel">{m.label}</span>
            </div>
          )
        })}
      </div>
      <div className="col-chart__legend">
        <span>
          <i style={{ background: RECEIPT_COLOR }} /> دریافتی‌ها
        </span>
        <span>
          <i style={{ background: EXPENSE_COLOR }} /> هزینه‌ها
        </span>
        <span className="col-chart__max">سقف {faNum(Math.round(max / 1_000_000) || 1)} م</span>
      </div>
    </div>
  )
}
