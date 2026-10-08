import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { MiniBarChart } from '../components/MiniBarChart'
import { faDate, faDateTime, toman } from '../lib/format'
import { PAYMENT_METHOD_LABEL } from '../store/types'
import { useBuildingState } from '../store/StoreContext'

/** Shared debt history + monthly trend for a unit (resident or manager). */
export function UnitDebtReport() {
  const { unitId: paramId } = useParams()
  const state = useBuildingState()
  const session = state.session!

  const unitId =
    session.role === 'resident' ? session.unitId! : paramId || session.unitId!

  const unit = state.units.find((u) => u.id === unitId)

  const bills = useMemo(
    () =>
      state.bills
        .filter((b) => b.unitId === unitId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [state.bills, unitId],
  )

  const payments = useMemo(
    () =>
      state.payments
        .filter((p) => p.unitId === unitId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [state.payments, unitId],
  )

  const timeline = useMemo(() => {
    const rows: {
      id: string
      at: string
      title: string
      sub: string
      amount: number
      kind: 'bill' | 'pay'
    }[] = []
    for (const b of bills) {
      rows.push({
        id: `b-${b.id}`,
        at: b.createdAt,
        title: b.title,
        sub: `${b.periodLabel} · مانده ${toman(b.total - b.paidOwner - b.paidResident)}`,
        amount: -(b.total - b.paidOwner - b.paidResident || b.total),
        kind: 'bill',
      })
    }
    for (const p of payments) {
      rows.push({
        id: `p-${p.id}`,
        at: p.createdAt,
        title: `پرداخت ${PAYMENT_METHOD_LABEL[p.method] ?? p.method}`,
        sub: [
          faDateTime(p.createdAt),
          p.bankName,
          `کد ${p.trackingCode}`,
        ]
          .filter(Boolean)
          .join(' · '),
        amount: p.amount,
        kind: 'pay',
      })
    }
    return rows.sort((a, b) => +new Date(b.at) - +new Date(a.at))
  }, [bills, payments])

  const trend = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of bills) {
      const d = new Date(b.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const due = b.total - b.paidOwner - b.paidResident
      map.set(key, (map.get(key) ?? 0) + Math.max(0, due))
    }
    const labels = [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
    return labels.map(([key, value]) => {
      const [y, m] = key.split('-').map(Number)
      const label = new Intl.DateTimeFormat('fa-IR', { month: 'short' }).format(
        new Date(y, m, 1),
      )
      return { label, value, color: 'var(--danger, #c45c4a)' }
    })
  }, [bills])

  if (!unit) {
    return (
      <div className="page">
        <BackButton fallback="/app/finance" />
        <h2>گزارش بدهی</h2>
        <div className="empty">واحد یافت نشد.</div>
      </div>
    )
  }

  const backTo =
    session.role === 'resident' ? '/app' : '/app/finance'

  return (
    <div className="page">
      <div className="page-head">
        <BackButton fallback={backTo} />
        <Link className="btn-ghost" to="/app/bills">
          قبوض
        </Link>
      </div>
      <h2>گزارش بدهی واحد {unit.number}</h2>
      <p className="lead">
        روند مانده، قبوض و پرداخت‌ها — {unit.residentName}
      </p>

      <div className="stat-row">
        <div className="stat">
          <span className="label">مانده فعلی</span>
          <span className="value">{toman(unit.balance)}</span>
        </div>
        <div className="stat">
          <span className="label">وضعیت</span>
          <span className="value" style={{ fontSize: '1rem' }}>
            {unit.balance < 0 ? 'بدهکار' : unit.balance > 0 ? 'بستانکار' : 'تسویه'}
          </span>
        </div>
      </div>

      <div className="panel">
        <h3>روند بدهی (مانده قبوض)</h3>
        <MiniBarChart items={trend} />
      </div>

      <div className="panel">
        <h3>تاریخچه</h3>
        <div className="list">
          {timeline.map((row) => (
            <div className="list-item" key={row.id}>
              <div>
                <div className="title">{row.title}</div>
                <div className="sub">
                  {faDate(row.at)}
                  <br />
                  {row.sub}
                </div>
              </div>
              <span className={`badge ${row.kind === 'pay' ? 'ok' : 'warn'}`}>
                {row.kind === 'pay' ? '+' : ''}
                {toman(Math.abs(row.amount))}
              </span>
            </div>
          ))}
          {timeline.length === 0 && <div className="empty">هنوز تراکنشی نیست.</div>}
        </div>
      </div>
    </div>
  )
}
