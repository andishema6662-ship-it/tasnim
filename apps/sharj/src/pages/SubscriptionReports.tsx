import { useMemo, useState } from 'react'
import { MiniBarChart } from '../components/MiniBarChart'
import { faDate, faNum, toman } from '../lib/format'
import {
  SUB_METHOD_LABEL,
  SUB_PERIOD_LABEL,
  SUB_STATUS_LABEL,
  isSubDebt,
  isSubPaid,
  type SubscriptionPayment,
} from '../store/platformTypes'
import { useStore } from '../store/StoreContext'

type PeriodFilter = 'all' | 3 | 6 | 12
type RangeFilter = 'all' | '30' | '90' | '365'
type ViewTab = 'list' | 'debts' | 'payments'

function withinRange(iso: string, range: RangeFilter): boolean {
  if (range === 'all') return true
  const days = Number(range)
  const t = +new Date(iso)
  return t >= Date.now() - days * 86400000
}

export function SubscriptionReports({
  onReview,
}: {
  onReview: (id: string, status: 'approved' | 'rejected') => void
}) {
  const { platform } = useStore()
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [buildingId, setBuildingId] = useState<string>('all')
  const [range, setRange] = useState<RangeFilter>('all')
  const [view, setView] = useState<ViewTab>('list')

  const filtered = useMemo(() => {
    return platform.admin.subscriptionPayments
      .filter((sp) => (period === 'all' ? true : sp.months === period))
      .filter((sp) => (buildingId === 'all' ? true : sp.buildingId === buildingId))
      .filter((sp) => withinRange(sp.createdAt, range))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [platform.admin.subscriptionPayments, period, buildingId, range])

  const paidRows = filtered.filter((sp) => isSubPaid(sp.status))
  const debtRows = filtered.filter((sp) => isSubDebt(sp.status))
  const paidTotal = paidRows.reduce((s, sp) => s + sp.amount, 0)
  const debtTotal = debtRows.reduce((s, sp) => s + sp.amount, 0)
  const allTotal = filtered.reduce((s, sp) => s + sp.amount, 0)

  const debtByBuilding = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; count: number }>()
    for (const sp of debtRows) {
      const b = platform.buildings.find((x) => x.id === sp.buildingId)
      const name = b?.name ?? sp.buildingId
      const cur = map.get(sp.buildingId) ?? { name, amount: 0, count: 0 }
      cur.amount += sp.amount
      cur.count += 1
      map.set(sp.buildingId, cur)
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount)
  }, [debtRows, platform.buildings])

  const paidByBuilding = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; count: number }>()
    for (const sp of paidRows) {
      const b = platform.buildings.find((x) => x.id === sp.buildingId)
      const name = b?.name ?? sp.buildingId
      const cur = map.get(sp.buildingId) ?? { name, amount: 0, count: 0 }
      cur.amount += sp.amount
      cur.count += 1
      map.set(sp.buildingId, cur)
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount)
  }, [paidRows, platform.buildings])

  const byPeriodBars = useMemo(() => {
    return ([3, 6, 12] as const).map((m) => ({
      label: SUB_PERIOD_LABEL[m],
      value: Math.round(
        filtered.filter((sp) => sp.months === m).reduce((s, sp) => s + sp.amount, 0) / 1_000_000,
      ),
      color: m === 12 ? 'var(--primary)' : m === 6 ? 'var(--accent)' : 'var(--mint)',
    }))
  }, [filtered])

  const renderRow = (sp: SubscriptionPayment) => {
    const b = platform.buildings.find((x) => x.id === sp.buildingId)
    return (
      <div className="panel" key={sp.id} style={{ marginBottom: 10 }}>
        <div className="list-item" style={{ paddingTop: 0 }}>
          <div>
            <div className="title">
              {b?.name ?? sp.buildingId} — {toman(sp.amount)}
            </div>
            <div className="sub">
              دوره: <strong>{SUB_PERIOD_LABEL[sp.months] ?? `${faNum(sp.months)} ماهه`}</strong>
              {' · '}
              {faNum(sp.units)} واحد
              <br />
              تاریخ پرداخت: <strong>{faDate(sp.createdAt)}</strong>
              <br />
              نحوه: {SUB_METHOD_LABEL[sp.method]}
              {sp.method === 'gateway' && sp.status === 'paid_demo' ? ' (دمو)' : ''}
              {sp.discountCode ? ` · تخفیف ${sp.discountCode}` : ''}
              <br />
              پیگیری: {sp.trackingCode}
              {sp.receiptNote ? (
                <>
                  <br />
                  {sp.receiptNote}
                </>
              ) : null}
              {sp.reviewedAt ? (
                <>
                  <br />
                  بررسی: {faDate(sp.reviewedAt)}
                  {sp.reviewedBy ? ` — ${sp.reviewedBy}` : ''}
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
        {sp.status === 'pending' && (
          <div className="grid-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onReview(sp.id, 'approved')}
            >
              تأیید
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onReview(sp.id, 'rejected')}
            >
              رد
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="stat-row">
        <div className="stat">
          <span className="label">جمع کل پرداختی</span>
          <span className="value">{toman(paidTotal)}</span>
        </div>
        <div className="stat">
          <span className="label">جمع کل بدهی</span>
          <span className="value">{toman(debtTotal)}</span>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat">
          <span className="label">مانده (بدهی − پرداختی فیلتر)</span>
          <span className="value">{toman(debtTotal - paidTotal)}</span>
        </div>
        <div className="stat">
          <span className="label">تعداد سند</span>
          <span className="value">{faNum(filtered.length)}</span>
        </div>
      </div>

      <div className="chip-row admin-nav">
        {(
          [
            ['list', 'جزئیات پرداخت‌ها'],
            ['debts', 'گزارش بدهی'],
            ['payments', 'گزارش پرداختی'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`chip ${view === id ? 'active' : ''}`}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="panel">
        <h3>فیلترها</h3>
        <div className="field">
          <label>دوره اشتراک</label>
          <div className="chip-row">
            {(
              [
                ['all', 'همه'],
                [3, '۳ ماهه'],
                [6, '۶ ماهه'],
                [12, '۱۲ ماهه'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={String(id)}
                type="button"
                className={`chip ${period === id ? 'active' : ''}`}
                onClick={() => setPeriod(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>ساختمان / بلوک</label>
          <select value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
            <option value="all">همه املاک</option>
            {platform.buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>بازه تاریخ پرداخت</label>
          <div className="chip-row">
            {(
              [
                ['all', 'همه'],
                ['30', '۳۰ روز'],
                ['90', '۹۰ روز'],
                ['365', 'یک سال'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`chip ${range === id ? 'active' : ''}`}
                onClick={() => setRange(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="sub">
          جمع اسناد فیلترشده: {toman(allTotal)} · پرداختی {toman(paidTotal)} · بدهی{' '}
          {toman(debtTotal)}
        </div>
      </div>

      <div className="panel">
        <h3>حجم مالی به تفکیک دوره (میلیون تومان)</h3>
        <MiniBarChart items={byPeriodBars} />
      </div>

      {view === 'list' && (
        <>
          <h3 style={{ margin: '4px 0 10px' }}>لیست جزئیات</h3>
          {filtered.map(renderRow)}
          {filtered.length === 0 && <div className="empty">پرداختی با این فیلتر نیست.</div>}
        </>
      )}

      {view === 'debts' && (
        <>
          <div className="panel">
            <h3>بدهی اشتراک به تفکیک ساختمان</h3>
            <p className="sub" style={{ marginTop: 0 }}>
              شامل وضعیت «در انتظار» و «ردشده» (نیاز به پرداخت/ارسال مجدد).
            </p>
            <div className="list">
              {debtByBuilding.map((row) => (
                <div className="list-item" key={row.name}>
                  <div>
                    <div className="title">{row.name}</div>
                    <div className="sub">{faNum(row.count)} سند بدهی</div>
                  </div>
                  <span className="badge warn">{toman(row.amount)}</span>
                </div>
              ))}
              {debtByBuilding.length === 0 && <div className="empty">بدهی در فیلتر فعلی نیست.</div>}
            </div>
            <div className="sub" style={{ marginTop: 10 }}>
              جمع کل بدهی: <strong>{toman(debtTotal)}</strong>
            </div>
          </div>
          <h3 style={{ margin: '4px 0 10px' }}>اسناد بدهی</h3>
          {debtRows.map(renderRow)}
        </>
      )}

      {view === 'payments' && (
        <>
          <div className="panel">
            <h3>پرداختی‌ها به تفکیک ساختمان</h3>
            <div className="list">
              {paidByBuilding.map((row) => (
                <div className="list-item" key={row.name}>
                  <div>
                    <div className="title">{row.name}</div>
                    <div className="sub">{faNum(row.count)} پرداخت تأیید/دمو</div>
                  </div>
                  <span className="badge ok">{toman(row.amount)}</span>
                </div>
              ))}
              {paidByBuilding.length === 0 && (
                <div className="empty">پرداختی در فیلتر فعلی نیست.</div>
              )}
            </div>
            <div className="sub" style={{ marginTop: 10 }}>
              جمع کل پرداختی: <strong>{toman(paidTotal)}</strong>
            </div>
          </div>
          <h3 style={{ margin: '4px 0 10px' }}>اسناد پرداختی</h3>
          {paidRows.map(renderRow)}
        </>
      )}
    </>
  )
}
