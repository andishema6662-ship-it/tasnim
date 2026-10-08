import { useMemo, useState } from 'react'
import { BackButton } from '../components/BackButton'
import { useBuildingState, useStore } from '../store/StoreContext'
import { SERVICE_TRADES, type ServiceWorker } from '../store/types'

const blank = (): ServiceWorker => ({
  id: '',
  name: '',
  phone: '',
  trade: SERVICE_TRADES[0],
  visibleToResidents: true,
  description: '',
  createdAt: new Date().toISOString(),
})

export function Services() {
  const { upsertServiceWorker, removeServiceWorker } = useStore()
  const state = useBuildingState()
  const role = state.session.role
  const isManager = role === 'manager' || role === 'financeManager'
  const [form, setForm] = useState<ServiceWorker | null>(null)

  const list = useMemo(() => {
    const all = [...state.serviceWorkers].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    )
    if (isManager) return all
    return all.filter((w) => w.visibleToResidents)
  }, [state.serviceWorkers, isManager])

  return (
    <div className="page">
      <div className="page-head">
        <BackButton fallback="/app/more" />
        {isManager && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '8px 14px', minHeight: 40 }}
            onClick={() => setForm(blank())}
          >
            سرویس‌کار جدید
          </button>
        )}
      </div>
      <h2>امور خدماتی</h2>
      <p className="lead">
        {isManager
          ? 'تعمیرکاران و سرویس‌کاران بلوک — نمایش برای ساکنین قابل تنظیم است.'
          : 'سرویس‌کارانی که مدیر برای ساکنین منتشر کرده است.'}
      </p>

      {form && isManager && (
        <div className="panel">
          <h3>{form.id ? 'ویرایش سرویس‌کار' : 'ثبت سرویس‌کار'}</h3>
          <div className="field">
            <label>نام</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>شماره تلفن</label>
            <input
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="field">
            <label>حرفه</label>
            <select
              value={form.trade}
              onChange={(e) => setForm({ ...form, trade: e.target.value })}
            >
              {SERVICE_TRADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>نمایش برای ساکنین</label>
            <select
              value={form.visibleToResidents ? 'yes' : 'no'}
              onChange={(e) =>
                setForm({ ...form, visibleToResidents: e.target.value === 'yes' })
              }
            >
              <option value="yes">بله — ساکنین می‌بینند</option>
              <option value="no">فقط مدیران</option>
            </select>
          </div>
          <div className="field">
            <label>توضیحات</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>
              انصراف
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!form.name.trim() || !form.phone.trim()) return
                upsertServiceWorker({
                  ...form,
                  id: form.id || `sw-${Date.now()}`,
                  name: form.name.trim(),
                  phone: form.phone.trim(),
                  description: form.description.trim(),
                  createdAt: form.id ? form.createdAt : new Date().toISOString(),
                })
                setForm(null)
              }}
            >
              ذخیره
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        <h3>فهرست</h3>
        <div className="list">
          {list.map((w) => (
            <div key={w.id} style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
              <div className="list-item" style={{ paddingTop: 0 }}>
                <div>
                  <div className="title">
                    {w.name} · {w.trade}
                  </div>
                  <div className="sub">
                    {w.phone}
                    <br />
                    {w.description || '—'}
                  </div>
                </div>
                <span className={`badge ${w.visibleToResidents ? 'ok' : 'soon'}`}>
                  {w.visibleToResidents ? 'ساکنین' : 'مدیران'}
                </span>
              </div>
              {isManager && (
                <div className="grid-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...w })}>
                    ویرایش
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      if (confirm('حذف این سرویس‌کار؟')) removeServiceWorker(w.id)
                    }}
                  >
                    حذف
                  </button>
                </div>
              )}
            </div>
          ))}
          {list.length === 0 && <div className="empty">سرویس‌کاری ثبت نشده.</div>}
        </div>
      </div>
    </div>
  )
}
