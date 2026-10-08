import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { faNum, toman } from '../lib/format'

/** Demo pricing table: monthly base per unit tier × period months */
const TIERS = [
  { maxUnits: 10, monthlyPerUnit: 45_000, name: 'کوچک' },
  { maxUnits: 30, monthlyPerUnit: 38_000, name: 'متوسط' },
  { maxUnits: 80, monthlyPerUnit: 32_000, name: 'بزرگ' },
  { maxUnits: Infinity, monthlyPerUnit: 28_000, name: 'برج' },
]

const PERIODS = [
  { months: 1, label: '۱ ماهه', discount: 0 },
  { months: 3, label: '۳ ماهه', discount: 0.05 },
  { months: 6, label: '۶ ماهه', discount: 0.1 },
  { months: 12, label: '۱۲ ماهه', discount: 0.18 },
]

function tierFor(units: number) {
  return TIERS.find((t) => units <= t.maxUnits) ?? TIERS[TIERS.length - 1]
}

export function Subscription() {
  const [units, setUnits] = useState(12)
  const [periodMonths, setPeriodMonths] = useState(12)

  const quote = useMemo(() => {
    const tier = tierFor(units)
    const period = PERIODS.find((p) => p.months === periodMonths) ?? PERIODS[0]
    const gross = units * tier.monthlyPerUnit * period.months
    const total = Math.round(gross * (1 - period.discount))
    return { tier, period, gross, total }
  }, [units, periodMonths])

  return (
    <div className="app-shell auth">
      <div className="page" style={{ paddingTop: 24 }}>
        <div className="brand-mark" style={{ marginBottom: 12 }}>
          <div className="logo">ش</div>
          <div>
            <div className="name">شارژبان</div>
            <span className="tag">اشتراک نرم‌افزار</span>
          </div>
        </div>
        <h2>پلن اشتراک</h2>
        <p className="lead">مبلغ بر اساس تعداد واحد محاسبه می‌شود (نه تعداد ساکنین) و برای کل ساختمان است.</p>

        <div className="panel">
          <div className="field">
            <label>تعداد واحد</label>
            <input
              type="number"
              min={1}
              value={units}
              onChange={(e) => setUnits(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="field">
            <label>دوره اشتراک</label>
            <select value={periodMonths} onChange={(e) => setPeriodMonths(Number(e.target.value))}>
              {PERIODS.map((p) => (
                <option key={p.months} value={p.months}>
                  {p.label}
                  {p.discount ? ` (تخفیف ${faNum(Math.round(p.discount * 100))}٪)` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="stat" style={{ marginBottom: 12 }}>
            <span className="label">
              پلن {quote.tier.name} · {faNum(units)} واحد · {quote.period.label}
            </span>
            <span className="value">{toman(quote.total)}</span>
          </div>
          <div className="sub">نرخ ماهانه هر واحد در این پلن: {toman(quote.tier.monthlyPerUnit)}</div>
        </div>

        <div className="panel">
          <h3>جدول قیمت دمو</h3>
          <table className="price-table">
            <thead>
              <tr>
                <th>پلن</th>
                <th>تا واحد</th>
                <th>ماهانه / واحد</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => (
                <tr key={t.name} className={quote.tier.name === t.name ? 'highlight' : undefined}>
                  <td>{t.name}</td>
                  <td>{t.maxUnits === Infinity ? 'نامحدود' : faNum(t.maxUnits)}</td>
                  <td>{toman(t.monthlyPerUnit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cta-row">
          <button type="button" className="btn btn-primary" disabled>
            خرید اشتراک — به‌زودی
          </button>
          <Link className="btn btn-secondary" to="/">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  )
}
