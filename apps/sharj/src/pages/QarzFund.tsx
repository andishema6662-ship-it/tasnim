import { useMemo, useState } from 'react'
import {
  approvalProgress,
  computeMonthlyPerUnit,
  fundDebt,
  fundReceived,
  impliedTotal,
  qarzStatusLabel,
  thresholdLabel,
  unitDebt,
  unitPaid,
} from '../lib/qarz'
import { faDate, faNum, toman } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'
import type { QarzApprovalThreshold, QarzFund as QarzFundType } from '../store/types'

export function QarzFund() {
  const {
    createQarzFund,
    submitQarzForApproval,
    voteQarzFund,
    payQarzDue,
    closeQarzFund,
  } = useStore()
  const state = useBuildingState()
  const role = state.session.role
  const isManager = role === 'manager'
  const canViewAll = role === 'manager' || role === 'financeManager'
  const myUnitId = state.session.unitId
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [title, setTitle] = useState('صندوق قرض‌الحسنه جدید')
  const [totalAmount, setTotalAmount] = useState(24_000_000)
  const [periodMonths, setPeriodMonths] = useState(12)
  const [selectedUnits, setSelectedUnits] = useState<string[]>(() =>
    state.units.map((u) => u.id),
  )
  const [threshold, setThreshold] = useState<QarzApprovalThreshold>('majority')
  const [overrideMonthly, setOverrideMonthly] = useState(false)
  const [manualMonthly, setManualMonthly] = useState(500_000)
  const [note, setNote] = useState('')

  const computedMonthly = useMemo(
    () => computeMonthlyPerUnit(totalAmount, selectedUnits.length || 1, periodMonths),
    [totalAmount, selectedUnits.length, periodMonths],
  )
  const monthly = overrideMonthly ? manualMonthly : computedMonthly
  const previewTotal = impliedTotal(monthly, selectedUnits.length || 1, periodMonths)

  const funds = useMemo(
    () =>
      [...state.qarzFunds].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      ),
    [state.qarzFunds],
  )

  const unitLabel = (id: string) => {
    const u = state.units.find((x) => x.id === id)
    return u ? `واحد ${u.number}` : id
  }

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const renderFund = (fund: QarzFundType) => {
    const progress = approvalProgress(fund)
    const received = fundReceived(fund)
    const debt = fundDebt(fund)
    const open = expandedId === fund.id
    const myVote = myUnitId
      ? fund.votes.find((v) => v.unitId === myUnitId)
      : undefined
    const canVote =
      !isManager &&
      fund.status === 'awaiting_approval' &&
      myVote &&
      myVote.approved === null

    return (
      <div className="panel" key={fund.id}>
        <div className="list-item" style={{ paddingTop: 0 }}>
          <div>
            <div className="title">{fund.title}</div>
            <div className="sub">
              مبلغ کل هدف: {toman(fund.totalAmount)} · دوره {faNum(fund.periodMonths)} ماه
              <br />
              سهم ماهانه هر واحد: {toman(fund.monthlyPerUnit)}
              {fund.overrideMonthly ? ' (دستی)' : ' (محاسبه‌شده)'}
              <br />
              اعضا: {faNum(fund.memberUnitIds.length)} واحد ·{' '}
              {thresholdLabel[fund.approvalThreshold]}
            </div>
          </div>
          <span
            className={`badge ${
              fund.status === 'active'
                ? 'ok'
                : fund.status === 'awaiting_approval'
                  ? 'warn'
                  : fund.status === 'completed'
                    ? 'ok'
                    : 'soon'
            }`}
          >
            {qarzStatusLabel[fund.status]}
          </span>
        </div>

        {fund.status === 'awaiting_approval' && (
          <div className="sub" style={{ marginTop: 8 }}>
            تأیید: {faNum(progress.yes)} موافق · {faNum(progress.no)} مخالف ·{' '}
            {faNum(progress.pending)} در انتظار (از {faNum(progress.total)})
            <div className="progress">
              <i style={{ width: `${Math.round((progress.yes / Math.max(1, progress.total)) * 100)}%` }} />
            </div>
          </div>
        )}

        {(fund.status === 'active' || fund.status === 'completed') && (
          <div className="stat-row" style={{ marginTop: 10 }}>
            <div className="stat">
              <span className="label">دریافتی کل</span>
              <span className="value" style={{ fontSize: '1.25rem' }}>
                {toman(received)}
              </span>
            </div>
            <div className="stat">
              <span className="label">بدهی مانده</span>
              <span className="value" style={{ fontSize: '1.25rem' }}>
                {toman(debt)}
              </span>
            </div>
          </div>
        )}

        {canVote && (
          <div className="grid-actions" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (voteQarzFund(fund.id, true)) flash('رأی موافق ثبت شد')
              }}
            >
              موافقم
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (voteQarzFund(fund.id, false)) flash('رأی مخالف ثبت شد')
              }}
            >
              مخالفم
            </button>
          </div>
        )}
        {myVote && myVote.approved !== null && fund.status === 'awaiting_approval' && (
          <div className="badge ok" style={{ marginTop: 8 }}>
            رأی شما: {myVote.approved ? 'موافق' : 'مخالف'}
          </div>
        )}

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setExpandedId(open ? null : fund.id)}
        >
          {open ? 'بستن جزئیات' : 'جزئیات، اقساط و گزارش'}
        </button>

        {open && (
          <div style={{ marginTop: 8 }}>
            {fund.note && <div className="sub">{fund.note}</div>}

            {(fund.status === 'awaiting_approval' || fund.status === 'draft') && (
              <>
                <h3 style={{ fontSize: '0.95rem' }}>وضعیت رأی واحدها</h3>
                <div className="list">
                  {fund.votes.map((v) => (
                    <div className="list-item" key={v.unitId}>
                      <div className="title">{unitLabel(v.unitId)}</div>
                      <span
                        className={`badge ${
                          v.approved === true ? 'ok' : v.approved === false ? 'danger' : 'soon'
                        }`}
                      >
                        {v.approved === true
                          ? 'موافق'
                          : v.approved === false
                            ? 'مخالف'
                            : 'در انتظار'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {(fund.status === 'active' || fund.status === 'completed') && (
              <>
                <h3 style={{ fontSize: '0.95rem' }}>گزارش واحدها</h3>
                <div className="list">
                  {fund.memberUnitIds.map((uid) => (
                    <div className="list-item" key={uid}>
                      <div>
                        <div className="title">{unitLabel(uid)}</div>
                        <div className="sub">
                          دریافتی {toman(unitPaid(fund, uid))} · بدهی{' '}
                          {toman(unitDebt(fund, uid))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontSize: '0.95rem', marginTop: 12 }}>
                  {canViewAll ? 'اقساط اعضا' : 'اقساط واحد من'}
                </h3>
                <div className="list">
                  {fund.dues
                    .filter((d) => canViewAll || d.unitId === myUnitId)
                    .slice(0, 24)
                    .map((d) => {
                      const remain = Math.max(0, d.amount - d.paidAmount)
                      return (
                        <div className="list-item" key={d.id}>
                          <div>
                            <div className="title">
                              {canViewAll ? `${unitLabel(d.unitId)} · ` : ''}
                              ماه {faNum(d.monthIndex)} — {toman(d.amount)}
                            </div>
                            <div className="sub">
                              سررسید {faDate(d.dueAt)}
                              {remain > 0 ? ` · مانده ${toman(remain)}` : ''}
                            </div>
                          </div>
                          {d.status === 'paid' ? (
                            <span className="badge ok">پرداخت‌شده</span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-copper"
                              style={{ minHeight: 40, padding: '6px 10px' }}
                              onClick={() => {
                                const code = payQarzDue(fund.id, d.id)
                                if (code) flash(`پرداخت ثبت شد — ${code}`)
                              }}
                            >
                              پرداخت
                            </button>
                          )}
                        </div>
                      )
                    })}
                </div>

                {fund.payments.length > 0 && (
                  <>
                    <h3 style={{ fontSize: '0.95rem', marginTop: 12 }}>آخرین دریافتی‌ها</h3>
                    <div className="list">
                      {fund.payments
                        .filter((p) => canViewAll || p.unitId === myUnitId)
                        .slice(0, 6)
                        .map((p) => (
                          <div className="list-item" key={p.id}>
                            <div>
                              <div className="title">{toman(p.amount)}</div>
                              <div className="sub">
                                {unitLabel(p.unitId)} · {faDate(p.createdAt)} · {p.trackingCode}
                              </div>
                            </div>
                            <span className="badge ok">رسید</span>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </>
            )}

            {isManager && fund.status === 'draft' && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => {
                  if (submitQarzForApproval(fund.id)) flash('برای تأیید اعضا ارسال شد')
                }}
              >
                ارسال برای تأیید اعضا
              </button>
            )}
            {isManager && (fund.status === 'active' || fund.status === 'completed') && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => {
                  closeQarzFund(fund.id)
                  flash('صندوق بسته شد')
                }}
              >
                بستن صندوق
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <h2>صندوق قرض‌الحسنه</h2>
      <p className="lead">
        ایجاد با تأیید اعضا، سهم ماهانه مشخص، ثبت پرداخت و گزارش بدهی/دریافتی.
      </p>

      <div className="panel">
        <h3>نحوه محاسبه سهم ماهانه</h3>
        <p className="sub" style={{ margin: 0, lineHeight: 1.7 }}>
          به‌صورت پیش‌فرض:{' '}
          <strong>مبلغ ماهانه هر واحد = مبلغ کل ÷ (تعداد واحد عضو × تعداد ماه دوره)</strong>
          . مدیر می‌تواند مبلغ ماهانه را دستی هم تنظیم کند؛ در آن صورت مبلغ کل هدف فقط برای
          نمایش است و جمع واقعی اقساط از مبلغ ماهانه به‌دست می‌آید.
        </p>
      </div>

      {isManager && (
        <button
          type="button"
          className="btn btn-copper"
          style={{ width: '100%', marginBottom: 12 }}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'بستن فرم' : 'پیشنهاد / ایجاد صندوق'}
        </button>
      )}

      {showForm && isManager && (
        <div className="panel">
          <h3>صندوق جدید</h3>
          <div className="field">
            <label>عنوان</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>مبلغ کل هدف (تومان)</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>تعداد ماه دوره</label>
            <input
              type="number"
              min={1}
              max={60}
              value={periodMonths}
              onChange={(e) => setPeriodMonths(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>آستانه تأیید</label>
            <select
              value={threshold}
              onChange={(e) => setThreshold(e.target.value as QarzApprovalThreshold)}
            >
              <option value="majority">اکثریت واحدها</option>
              <option value="unanimous">اتفاق آرا</option>
            </select>
          </div>
          <div className="field">
            <label>واحدهای عضو</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {state.units.map((u) => {
                const checked = selectedUnits.includes(u.id)
                return (
                  <label
                    key={u.id}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.9rem' }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setSelectedUnits((prev) =>
                          e.target.checked
                            ? [...prev, u.id]
                            : prev.filter((id) => id !== u.id),
                        )
                      }
                    />
                    واحد {u.number}
                  </label>
                )
              })}
            </div>
          </div>
          <label
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 10,
              fontSize: '0.9rem',
            }}
          >
            <input
              type="checkbox"
              checked={overrideMonthly}
              onChange={(e) => setOverrideMonthly(e.target.checked)}
            />
            تنظیم دستی مبلغ ماهانه هر واحد
          </label>
          {overrideMonthly ? (
            <div className="field">
              <label>مبلغ ماهانه هر واحد</label>
              <input
                type="number"
                value={manualMonthly}
                onChange={(e) => setManualMonthly(Number(e.target.value))}
              />
            </div>
          ) : null}
          <div className="stat" style={{ marginBottom: 12 }}>
            <span className="label">
              سهم ماهانه پیشنهادی · جمع اقساط ≈ {toman(previewTotal)}
            </span>
            <span className="value">{toman(monthly)}</span>
          </div>
          <div className="field">
            <label>توضیح (اختیاری)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="grid-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const id = createQarzFund({
                  title,
                  totalAmount,
                  periodMonths,
                  memberUnitIds: selectedUnits,
                  approvalThreshold: threshold,
                  monthlyPerUnit: monthly,
                  overrideMonthly,
                  note,
                  submitForApproval: false,
                })
                if (id) {
                  setShowForm(false)
                  flash('پیش‌نویس ذخیره شد')
                }
              }}
            >
              ذخیره پیش‌نویس
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const id = createQarzFund({
                  title,
                  totalAmount,
                  periodMonths,
                  memberUnitIds: selectedUnits,
                  approvalThreshold: threshold,
                  monthlyPerUnit: monthly,
                  overrideMonthly,
                  note,
                  submitForApproval: true,
                })
                if (id) {
                  setShowForm(false)
                  flash('برای تأیید اعضا ارسال شد')
                }
              }}
            >
              ارسال برای تأیید
            </button>
          </div>
        </div>
      )}

      {funds.map(renderFund)}
      {funds.length === 0 && <div className="empty">هنوز صندوقی تعریف نشده.</div>}

      {!isManager && (
        <div className="panel">
          <p className="sub" style={{ margin: 0 }}>
            برای رأی‌دادن با نقش ساکن/واحد وارد شوید. هر واحد یک رأی دارد.
          </p>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
