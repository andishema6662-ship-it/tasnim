import { faNum, toman } from '../lib/format'
import type { MonthCashflow } from '../lib/financeChart'

const SERIES_A_COLOR = 'var(--mint, #1f8a5b)'
const SERIES_B_COLOR = 'var(--copper, #c4784a)'

/** Vertical grouped bar chart — two series per Jalali month. */
export function GroupedBarChart({
  months,
  height = 168,
  seriesALabel = 'دریافتی‌ها',
  seriesBLabel = 'هزینه‌ها',
  ariaLabel,
}: {
  months: MonthCashflow[]
  height?: number
  seriesALabel?: string
  seriesBLabel?: string
  ariaLabel?: string
}) {
  if (months.length === 0) return <div className="empty">داده‌ای نیست.</div>

  const max = Math.max(1, ...months.flatMap((m) => [m.receipts, m.expenses]))

  return (
    <div
      className="col-chart"
      aria-label={ariaLabel ?? `نمودار میله‌ای ${seriesALabel} و ${seriesBLabel}`}
    >
      <div className="col-chart__plot" style={{ height }}>
        {months.map((m) => {
          const aPct = Math.round((m.receipts / max) * 100)
          const bPct = Math.round((m.expenses / max) * 100)
          return (
            <div className="col-chart__group" key={m.key}>
              <div className="col-chart__bars">
                <div
                  className="col-chart__bar col-chart__bar--receipt"
                  style={{ height: `${Math.max(aPct, m.receipts > 0 ? 4 : 0)}%` }}
                  title={`${seriesALabel} ${toman(m.receipts)}`}
                />
                <div
                  className="col-chart__bar col-chart__bar--expense"
                  style={{ height: `${Math.max(bPct, m.expenses > 0 ? 4 : 0)}%` }}
                  title={`${seriesBLabel} ${toman(m.expenses)}`}
                />
              </div>
              <span className="col-chart__xlabel">{m.label}</span>
            </div>
          )
        })}
      </div>
      <div className="col-chart__legend">
        <span>
          <i style={{ background: SERIES_A_COLOR }} /> {seriesALabel}
        </span>
        <span>
          <i style={{ background: SERIES_B_COLOR }} /> {seriesBLabel}
        </span>
        <span className="col-chart__max">سقف {faNum(Math.round(max / 1_000_000) || 1)} م</span>
      </div>
    </div>
  )
}
