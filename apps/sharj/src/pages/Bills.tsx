import { useMemo, useState } from 'react'
import { useBuildingFeatures } from '../components/FeatureGate'
import { formulaLabel } from '../lib/charges'
import { billRemaining, previewInstallments } from '../lib/installments'
import { JalaliDateValueField } from '../components/JalaliDateField'
import {
  faDate,
  faNum,
  jalaliDateValueToIso,
  toman,
  toJalaliDateValue,
} from '../lib/format'
import {
  defaultCallbackUrl,
  saveZarinpalIntent,
  zarinpalRequest,
} from '../lib/zarinpal'
import { useBuildingState, useStore } from '../store/StoreContext'
import type { Bill, DebtParty } from '../store/types'

export function Bills() {
  const { payBill, createInstallmentPlan, payInstallment, platform } = useStore()
  const state = useBuildingState()
  const features = useBuildingFeatures()
  const [toast, setToast] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [planBillId, setPlanBillId] = useState<string | null>(null)
  const [count, setCount] = useState(4)
  const [startDate, setStartDate] = useState(toJalaliDateValue(new Date().toISOString()))
  const [intervalMonths, setIntervalMonths] = useState(1)
  const session = state.session!
  const isManager = session.role === 'manager' || session.role === 'financeManager'
  const canInstallments = features.has('installments')
  const canOnlinePay = features.has('payments')
  const gw = platform.admin.gateway
  const gatewayOnline =
    canOnlinePay &&
    gw.enabled &&
    (gw.mode === 'gateway' || gw.mode === 'both')
  const bills =
    session.role === 'resident'
      ? state.bills.filter((b) => b.unitId === session.unitId)
      : state.bills

  const planBill = bills.find((b) => b.id === planBillId) ?? null
  const preview = useMemo(() => {
    if (!planBill) return []
    const rem = billRemaining(planBill)
    if (rem <= 0) return []
    return previewInstallments(rem, count, jalaliDateValueToIso(startDate), intervalMonths)
  }, [planBill, count, startDate, intervalMonths])

  const payDemo = (billId: string, party: DebtParty) => {
    const code = payBill(billId, party)
    if (code) {
      setToast(`پرداخت دمو موفق — رسید با کد ${code} ثبت شد.`)
      setTimeout(() => setToast(null), 4000)
    }
  }

  const payOnline = async (billId: string, party: DebtParty) => {
    const bill = bills.find((b) => b.id === billId)
    if (!bill) return
    const due =
      party === 'owner'
        ? Math.max(0, bill.ownerShare - bill.paidOwner)
        : Math.max(0, bill.residentShare - bill.paidResident)
    if (due < 1000) {
      setToast('حداقل مبلغ درگاه ۱٬۰۰۰ تومان است.')
      setTimeout(() => setToast(null), 3500)
      return
    }
    setPaying(true)
    try {
      const orderId = `bill-${billId}-${party}-${Date.now()}`
      const callbackUrl = defaultCallbackUrl(gw.callbackUrl)
      saveZarinpalIntent({
        kind: 'bill',
        orderId,
        amountToman: due,
        description: `شارژبان — ${bill.title} (${party === 'owner' ? 'مالک' : 'ساکن'})`,
        billId,
        party,
        buildingId: state.buildingId,
        createdAt: new Date().toISOString(),
      })
      const req = await zarinpalRequest({
        amountToman: due,
        description: `شارژبان — ${bill.title}`,
        callbackUrl,
        orderId,
      })
      saveZarinpalIntent({
        kind: 'bill',
        orderId,
        amountToman: due,
        description: `شارژبان — ${bill.title}`,
        billId,
        party,
        buildingId: state.buildingId,
        authority: req.authority,
        createdAt: new Date().toISOString(),
      })
      window.location.href = req.start_pay_url
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'خطا در اتصال به درگاه')
      setTimeout(() => setToast(null), 4500)
      setPaying(false)
    }
  }

  const payInst = (billId: string, installmentId: string) => {
    const party: DebtParty = session.role === 'manager' ? 'owner' : 'resident'
    const code = payInstallment(billId, installmentId, party)
    if (code) {
      setToast(`قسط پرداخت شد — کد ${code}`)
      setTimeout(() => setToast(null), 3500)
    }
  }

  const renderInstallments = (b: Bill) => {
    if (!b.installments?.length) return null
    return (
      <div style={{ marginTop: 12 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>برنامه اقساط</h3>
        <div className="list">
          {b.installments.map((inst) => (
            <div className="list-item" key={inst.id}>
              <div>
                <div className="title">
                  قسط {faNum(inst.index)} — {toman(inst.amount)}
                </div>
                <div className="sub">سررسید {faDate(inst.dueAt)}</div>
              </div>
              {inst.status === 'paid' ? (
                <span className="badge ok">پرداخت‌شده</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-copper"
                  style={{ minHeight: 40, padding: '6px 12px' }}
                  onClick={() => payInst(b.id, inst.id)}
                >
                  پرداخت قسط
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h2>شارژ و قبوض</h2>
      <p className="lead">
        تفکیک بدهی مالک و ساکن؛ تقسیط و پرداخت آنلاین
        {gw.sandbox ? ' (زرین‌پال سندباکس)' : ' (زرین‌پال)'}.
        مبالغ به تومان است — درگاه با واحد {gw.currency === 'IRR' ? 'ریال (×۱۰)' : 'تومان (IRT)'}.
      </p>
      <div className="list">
        {bills.map((b) => {
          const unit = state.units.find((u) => u.id === b.unitId)
          const ownerDue = Math.max(0, b.ownerShare - b.paidOwner)
          const residentDue = Math.max(0, b.residentShare - b.paidResident)
          const rem = billRemaining(b)
          const paidPct = Math.round(((b.paidOwner + b.paidResident) / b.total) * 100)
          const hasPlan = Boolean(b.installments?.length)
          return (
            <div className="panel" key={b.id}>
              <div className="list-item" style={{ paddingTop: 0 }}>
                <div>
                  <div className="title">
                    {isManager ? `واحد ${unit?.number} — ` : ''}
                    {b.title}
                  </div>
                  <div className="sub">
                    {b.periodLabel} · {formulaLabel[b.formula]} · {faDate(b.createdAt)}
                    <br />
                    کل: {toman(b.total)}
                    {hasPlan && (
                      <>
                        <br />
                        <span className="badge warn">تقسیط‌شده</span>
                      </>
                    )}
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

              {canInstallments && renderInstallments(b)}

              {b.status !== 'paid' && (
                <div className="grid-actions" style={{ marginTop: 12 }}>
                  {gatewayOnline && !hasPlan && ownerDue > 0 && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={paying}
                      onClick={() => payOnline(b.id, 'owner')}
                    >
                      پرداخت آنلاین سهم مالک
                    </button>
                  )}
                  {gatewayOnline && !hasPlan && residentDue > 0 && (
                    <button
                      type="button"
                      className="btn btn-copper"
                      disabled={paying}
                      onClick={() => payOnline(b.id, 'resident')}
                    >
                      پرداخت آنلاین سهم ساکن
                    </button>
                  )}
                  {canOnlinePay && !hasPlan && ownerDue > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => payDemo(b.id, 'owner')}
                    >
                      پرداخت دمو مالک
                    </button>
                  )}
                  {canOnlinePay && !hasPlan && residentDue > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => payDemo(b.id, 'resident')}
                    >
                      پرداخت دمو ساکن
                    </button>
                  )}
                  {!canOnlinePay && (
                    <span className="badge soon">پرداخت آنلاین برای این ساختمان غیرفعال است</span>
                  )}
                  {isManager && canInstallments && rem > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ gridColumn: hasPlan ? '1 / -1' : undefined }}
                      onClick={() => {
                        setPlanBillId(b.id)
                        setCount(4)
                        setStartDate(toJalaliDateValue(new Date().toISOString()))
                      }}
                    >
                      {hasPlan ? 'بازتنظیم تقسیط' : 'تقسیط'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {bills.length === 0 && <div className="empty">قبضی ثبت نشده.</div>}
      </div>

      {planBill && isManager && canInstallments && (
        <div className="panel">
          <h3>تقسیط — {planBill.title}</h3>
          <p className="sub" style={{ marginTop: 0 }}>
            مانده قابل تقسیط: {toman(billRemaining(planBill))}
          </p>
          <div className="grid-actions">
            <div className="field">
              <label>تعداد اقساط (۲–۱۲)</label>
              <input
                type="number"
                min={2}
                max={12}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>فاصله (ماه)</label>
              <select
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(Number(e.target.value))}
              >
                <option value={1}>ماهانه</option>
                <option value={2}>هر ۲ ماه</option>
                <option value={3}>فصلی</option>
              </select>
            </div>
          </div>
          <JalaliDateValueField
            label="تاریخ شروع / اولین سررسید (شمسی)"
            value={startDate}
            onChange={setStartDate}
          />
          <h3 style={{ fontSize: '0.95rem' }}>پیش‌نمایش</h3>
          <div className="list">
            {preview.map((p) => (
              <div className="list-item" key={p.index}>
                <div className="title">
                  قسط {faNum(p.index)} — {toman(p.amount)}
                </div>
                <div className="sub">{faDate(p.dueAt)}</div>
              </div>
            ))}
          </div>
          <div className="grid-actions" style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setPlanBillId(null)}>
              انصراف
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const ok = createInstallmentPlan(
                  planBill.id,
                  count,
                  jalaliDateValueToIso(startDate),
                  intervalMonths,
                )
                if (ok) {
                  setToast('برنامه اقساط ذخیره شد')
                  setPlanBillId(null)
                  setTimeout(() => setToast(null), 2500)
                }
              }}
            >
              تأیید تقسیط
            </button>
          </div>
        </div>
      )}

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
