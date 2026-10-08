import { useMemo, useState } from 'react'
import { MiniBarChart } from '../components/MiniBarChart'
import { faDate, faNum, toman, toLocalInput } from '../lib/format'
import { useStore } from '../store/StoreContext'
import {
  COMPLEX_EXPENSE_CATEGORIES,
  COMPLEX_INCOME_CATEGORIES,
  type ComplexLedgerEntry,
  type ComplexLedgerKind,
} from '../store/platformTypes'

export function ComplexFinance({
  complexId,
  displayName,
}: {
  complexId: string
  displayName: string
}) {
  const { platform, upsertComplexLedger, removeComplexLedger } = useStore()
  const complex = platform.admin.complexes.find((c) => c.id === complexId)
  const blocks = (complex?.blockIds ?? [])
    .map((id) => platform.buildings.find((b) => b.id === id))
    .filter(Boolean)

  const entries = useMemo(
    () =>
      (platform.admin.complexLedger ?? [])
        .filter((e) => e.complexId === complexId)
        .sort((a, b) => +new Date(b.at) - +new Date(a.at)),
    [platform.admin.complexLedger, complexId],
  )

  const [form, setForm] = useState<ComplexLedgerEntry | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }

  const income = entries.filter((e) => e.kind === 'income').reduce((s, e) => s + e.amount, 0)
  const expense = entries.filter((e) => e.kind === 'expense').reduce((s, e) => s + e.amount, 0)

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of entries) {
      const key = `${e.kind === 'expense' ? 'هزینه' : 'درآمد'}: ${e.category}`
      map.set(key, (map.get(key) ?? 0) + e.amount)
    }
    return [...map.entries()]
      .map(([label, value]) => ({
        label: label.slice(0, 16),
        value: Math.round(value / 1_000_000),
        color: label.startsWith('هزینه') ? 'var(--copper)' : 'var(--teal)',
      }))
      .sort((a, b) => b.value - a.value)
  }, [entries])

  const empty = (kind: ComplexLedgerKind): ComplexLedgerEntry => ({
    id: `cl-${Date.now()}`,
    complexId,
    kind,
    category: kind === 'expense' ? COMPLEX_EXPENSE_CATEGORIES[0] : COMPLEX_INCOME_CATEGORIES[0],
    title: '',
    amount: 0,
    note: '',
    buildingId: undefined,
    at: new Date().toISOString(),
    createdBy: displayName,
  })

  return (
    <>
      <div className="stat-row">
        <div className="stat">
          <span className="label">جمع درآمد</span>
          <span className="value">{toman(income)}</span>
        </div>
        <div className="stat">
          <span className="label">جمع هزینه</span>
          <span className="value">{toman(expense)}</span>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat">
          <span className="label">مانده شهرک</span>
          <span className="value">{toman(income - expense)}</span>
        </div>
        <div className="stat">
          <span className="label">تعداد سند</span>
          <span className="value">{faNum(entries.length)}</span>
        </div>
      </div>

      <div className="panel">
        <h3>گزارش دسته‌ها (میلیون تومان)</h3>
        <MiniBarChart items={byCategory} />
      </div>

      <div className="grid-actions" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setForm(empty('expense'))}
        >
          ثبت هزینه
        </button>
        <button
          type="button"
          className="btn btn-copper"
          onClick={() => setForm(empty('income'))}
        >
          ثبت درآمد
        </button>
      </div>

      {form && (
        <div className="panel">
          <h3>{form.kind === 'expense' ? 'هزینه / مخارج' : 'درآمد'}</h3>
          <div className="field">
            <label>عنوان</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid-actions">
            <div className="field">
              <label>دسته</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {(form.kind === 'expense'
                  ? COMPLEX_EXPENSE_CATEGORIES
                  : COMPLEX_INCOME_CATEGORIES
                ).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>مبلغ (تومان)</label>
              <input
                type="number"
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="field">
            <label>تاریخ</label>
            <input
              type="date"
              value={toLocalInput(form.at).slice(0, 10)}
              onChange={(e) =>
                setForm({ ...form, at: `${e.target.value}T12:00:00.000Z` })
              }
            />
          </div>
          <div className="field">
            <label>بلوک مرتبط (اختیاری)</label>
            <select
              value={form.buildingId ?? ''}
              onChange={(e) =>
                setForm({ ...form, buildingId: e.target.value || undefined })
              }
            >
              <option value="">— سطح شهرک —</option>
              {blocks.map((b) =>
                b ? (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ) : null,
              )}
            </select>
          </div>
          <div className="field">
            <label>یادداشت</label>
            <textarea
              value={form.note ?? ''}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
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
                if (!form.title.trim() || form.amount <= 0) return
                upsertComplexLedger({
                  ...form,
                  title: form.title.trim(),
                  note: form.note?.trim() || undefined,
                })
                setForm(null)
                flash('سند مالی ذخیره شد')
              }}
            >
              ذخیره
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        <h3>اسناد مالی شهرک</h3>
        <div className="list">
          {entries.map((e) => {
            const b = platform.buildings.find((x) => x.id === e.buildingId)
            return (
              <div key={e.id} style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
                <div className="list-item" style={{ paddingTop: 0 }}>
                  <div>
                    <div className="title">{e.title}</div>
                    <div className="sub">
                      {e.category} · {faDate(e.at)}
                      {b ? ` · ${b.name}` : ' · سطح شهرک'}
                      {e.note ? (
                        <>
                          <br />
                          {e.note}
                        </>
                      ) : null}
                    </div>
                  </div>
                  <span className={`badge ${e.kind === 'income' ? 'ok' : 'warn'}`}>
                    {e.kind === 'income' ? '+' : '−'}
                    {toman(e.amount)}
                  </span>
                </div>
                <div className="grid-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setForm({ ...e })}
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      if (confirm('حذف این سند؟')) {
                        removeComplexLedger(e.id)
                        flash('حذف شد')
                      }
                    }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            )
          })}
          {entries.length === 0 && <div className="empty">سندی ثبت نشده.</div>}
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
