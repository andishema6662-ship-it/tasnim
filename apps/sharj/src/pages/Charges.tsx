import { useState } from 'react'
import { formulaLabel, periodLabel } from '../lib/charges'
import { faNum, toman } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'
import type { ChargeFormula, ChargePeriod, ChargeSchedule } from '../store/types'

export function Charges() {
  const { runSchedule, upsertSchedule } = useStore()
  const state = useBuildingState()
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: 'شارژ جدید',
    formula: 'fixed' as ChargeFormula,
    amountOrRate: 1000000,
    dayOfMonth: 5,
    period: 'monthly' as ChargePeriod,
    ownerSharePercent: 40,
  })

  if (state.session?.role !== 'manager') {
    return (
      <div className="page">
        <h2>شارژ</h2>
        <p className="lead">تنظیم فرمول‌ها فقط برای مدیر است. صورت‌حساب خود را از «قبوض» ببینید.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h2>شارژ و زمان‌بندی</h2>
      <p className="lead">فرمول‌های ثابت، متراژی، نفری و مصرفی — ثبت دوره‌ای ماهانه یا فصلی.</p>

      <div className="list list-grid-2">
        {state.schedules.map((s) => (
          <div className="panel" key={s.id}>
            <div className="list-item" style={{ paddingTop: 0 }}>
              <div>
                <div className="title">{s.title}</div>
                <div className="sub">
                  {formulaLabel[s.formula]} · {periodLabel[s.period]} · روز {faNum(s.dayOfMonth)} هر دوره
                  <br />
                  نرخ/مبلغ: {toman(s.amountOrRate)} · سهم مالک {faNum(s.ownerSharePercent)}٪
                  {s.lastRunAt && (
                    <>
                      <br />
                      آخرین اجرا ثبت شده
                    </>
                  )}
                </div>
              </div>
              <span className={`badge ${s.active ? 'ok' : 'soon'}`}>{s.active ? 'فعال' : 'غیرفعال'}</span>
            </div>
            <div className="grid-actions" style={{ marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const n = runSchedule(s.id)
                  setToast(`${n} قبض برای واحدها صادر شد`)
                  setTimeout(() => setToast(null), 2800)
                }}
              >
                اجرای الآن
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => upsertSchedule({ ...s, active: !s.active })}
              >
                {s.active ? 'غیرفعال' : 'فعال‌سازی'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>افزودن زمان‌بندی</h3>
        <div className="field">
          <label>عنوان</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="field">
          <label>فرمول</label>
          <select
            value={form.formula}
            onChange={(e) => setForm({ ...form, formula: e.target.value as ChargeFormula })}
          >
            <option value="fixed">ثابت</option>
            <option value="area">متراژی</option>
            <option value="perPerson">نفری</option>
            <option value="consumption">مصرفی</option>
          </select>
        </div>
        <div className="field">
          <label>مبلغ / نرخ (تومان)</label>
          <input
            type="number"
            value={form.amountOrRate}
            onChange={(e) => setForm({ ...form, amountOrRate: Number(e.target.value) })}
          />
        </div>
        <div className="grid-actions">
          <div className="field">
            <label>روز ماه</label>
            <input
              type="number"
              min={1}
              max={28}
              value={form.dayOfMonth}
              onChange={(e) => setForm({ ...form, dayOfMonth: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>دوره</label>
            <select
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value as ChargePeriod })}
            >
              <option value="monthly">ماهانه</option>
              <option value="seasonal">فصلی</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>درصد سهم مالک</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.ownerSharePercent}
            onChange={(e) => setForm({ ...form, ownerSharePercent: Number(e.target.value) })}
          />
        </div>
        <button
          type="button"
          className="btn btn-copper"
          style={{ width: '100%' }}
          onClick={() => {
            const schedule: ChargeSchedule = {
              id: `s-${Date.now()}`,
              ...form,
              active: true,
            }
            upsertSchedule(schedule)
            setToast('زمان‌بندی ذخیره شد')
            setTimeout(() => setToast(null), 2200)
          }}
        >
          ذخیره زمان‌بندی
        </button>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
