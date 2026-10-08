import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { faDateTime, toman } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'
import {
  PAYMENT_METHOD_LABEL,
  type LedgerEntry,
  type LedgerKind,
  type PaymentMethod,
} from '../store/types'

export function Finance() {
  const { addLedger, updateLedger, removeLedger } = useStore()
  const state = useBuildingState()
  const [kind, setKind] = useState<LedgerKind>('expense')
  const [category, setCategory] = useState('نظافت')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState(500000)
  const [note, setNote] = useState('')
  const [visible, setVisible] = useState(true)
  const [edit, setEdit] = useState<LedgerEntry | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (state.session?.role !== 'manager' && state.session?.role !== 'financeManager') {
    return (
      <div className="page">
        <h2>مالی</h2>
        <p className="lead">
          گزارش مدیر فقط برای نقش مدیر در دسترس است. شفافیت هزینه‌ها را از بخش هزینه‌ها ببینید.
        </p>
      </div>
    )
  }

  const debtors = state.units.filter((u) => u.balance < 0)
  const isManager = state.session.role === 'manager'

  const detailFor = (e: LedgerEntry) => {
    const pay = e.paymentId
      ? state.payments.find((p) => p.id === e.paymentId)
      : state.payments.find(
          (p) => e.trackingCode && p.trackingCode === e.trackingCode,
        ) ||
        (e.note?.includes('کد')
          ? state.payments.find((p) => e.note.includes(p.trackingCode))
          : undefined)
    const method = (e.method ?? pay?.method) as PaymentMethod | undefined
    const bank = e.bankName ?? pay?.bankName
    const tracking = e.trackingCode ?? pay?.trackingCode
    return { pay, method, bank, tracking }
  }

  return (
    <div className="page">
      <div className="page-head">
        <BackButton fallback="/app" />
      </div>
      <h2>مالی و صندوق</h2>
      <p className="lead">هزینه/درآمد، مانده صندوق، بدهکار و بستانکار واحدها.</p>
      <div className="stat-row">
        <div className="stat">
          <span className="label">مانده صندوق</span>
          <span className="value">{toman(state.fundBalance)}</span>
        </div>
        <div className="stat">
          <span className="label">تعداد بدهکار</span>
          <span className="value">{debtors.length}</span>
        </div>
      </div>

      <div className="panel">
        <h3>وضعیت واحدها</h3>
        <p className="sub" style={{ marginTop: 0 }}>
          برای دیدن گزارش بدهی هر واحد روی آن بزنید.
        </p>
        <div className="list">
          {state.units.map((u) => (
            <Link
              className="list-item list-item--link"
              key={u.id}
              to={`/app/debt/${u.id}`}
            >
              <div>
                <div className="title">واحد {u.number}</div>
                <div className="sub">
                  {u.residentName} · {toman(u.balance)}
                </div>
              </div>
              <span className={`badge ${u.balance < 0 ? 'danger' : u.balance > 0 ? 'ok' : ''}`}>
                {u.balance < 0 ? 'بدهکار' : u.balance > 0 ? 'بستانکار' : 'تسویه'}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {isManager && (
        <div className="panel">
          <h3>{edit ? 'ویرایش سند' : 'ثبت سند'}</h3>
          <div className="field">
            <label>نوع</label>
            <select
              value={edit?.kind ?? kind}
              onChange={(e) => {
                const v = e.target.value as LedgerKind
                if (edit) setEdit({ ...edit, kind: v })
                else setKind(v)
              }}
            >
              <option value="expense">هزینه</option>
              <option value="income">درآمد</option>
            </select>
          </div>
          <div className="field">
            <label>دسته</label>
            <input
              value={edit?.category ?? category}
              onChange={(e) =>
                edit
                  ? setEdit({ ...edit, category: e.target.value })
                  : setCategory(e.target.value)
              }
            />
          </div>
          <div className="field">
            <label>عنوان</label>
            <input
              value={edit?.title ?? title}
              onChange={(e) =>
                edit ? setEdit({ ...edit, title: e.target.value }) : setTitle(e.target.value)
              }
            />
          </div>
          <div className="field">
            <label>مبلغ</label>
            <input
              type="number"
              value={edit?.amount ?? amount}
              onChange={(e) => {
                const n = Number(e.target.value)
                if (edit) setEdit({ ...edit, amount: n })
                else setAmount(n)
              }}
            />
          </div>
          <div className="field">
            <label>توضیح</label>
            <textarea
              value={edit?.note ?? note}
              onChange={(e) =>
                edit ? setEdit({ ...edit, note: e.target.value }) : setNote(e.target.value)
              }
            />
          </div>
          <label
            style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: '0.9rem' }}
          >
            <input
              type="checkbox"
              checked={edit?.visibleToResidents ?? visible}
              onChange={(e) =>
                edit
                  ? setEdit({ ...edit, visibleToResidents: e.target.checked })
                  : setVisible(e.target.checked)
              }
            />
            نمایش برای ساکنین (شفافیت)
          </label>
          <div className="grid-actions">
            {edit && (
              <button type="button" className="btn btn-secondary" onClick={() => setEdit(null)}>
                انصراف
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: edit ? undefined : '100%', gridColumn: edit ? undefined : '1 / -1' }}
              onClick={() => {
                if (edit) {
                  if (!edit.title.trim()) return
                  updateLedger({ ...edit, title: edit.title.trim() })
                  setEdit(null)
                  return
                }
                if (!title.trim()) return
                addLedger({
                  kind,
                  category,
                  title: title.trim(),
                  amount,
                  note,
                  visibleToResidents: visible,
                })
                setTitle('')
                setNote('')
              }}
            >
              {edit ? 'ذخیره تغییرات' : 'ثبت در دفتر'}
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        <h3>گزارش اخیر</h3>
        <div className="list">
          {state.ledger.slice(0, 12).map((e) => {
            const open = expandedId === e.id
            const { method, bank, tracking } = detailFor(e)
            return (
              <div key={e.id} className="finance-report-row">
                <button
                  type="button"
                  className="list-item list-item--link"
                  style={{ width: '100%', textAlign: 'start', border: 0, background: 'transparent' }}
                  onClick={() => setExpandedId(open ? null : e.id)}
                >
                  <div>
                    <div className="title">{e.title}</div>
                    <div className="sub">
                      {e.category} · {faDateTime(e.createdAt)}
                      {!e.visibleToResidents && ' · داخلی'}
                    </div>
                  </div>
                  <span className={`badge ${e.kind === 'income' ? 'ok' : 'warn'}`}>
                    {e.kind === 'income' ? '+' : '−'}
                    {toman(e.amount)}
                  </span>
                </button>
                {open && (
                  <div className="finance-report-detail">
                    <div>
                      <strong>زمان:</strong> {faDateTime(e.createdAt)}
                    </div>
                    <div>
                      <strong>نحوه پرداخت:</strong>{' '}
                      {method ? PAYMENT_METHOD_LABEL[method] : e.kind === 'expense' ? '— (هزینه)' : 'ثبت دستی'}
                    </div>
                    <div>
                      <strong>بانک / حساب:</strong> {bank || '—'}
                    </div>
                    <div>
                      <strong>کد رهگیری:</strong> {tracking || '—'}
                    </div>
                    {e.note && (
                      <div>
                        <strong>یادداشت:</strong> {e.note}
                      </div>
                    )}
                    {isManager && e.kind === 'expense' && (
                      <div className="grid-actions" style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setEdit({ ...e })}
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            if (confirm('حذف این سند؟')) removeLedger(e.id)
                          }}
                        >
                          حذف
                        </button>
                      </div>
                    )}
                    {isManager && e.kind === 'income' && !e.paymentId && (
                      <div className="grid-actions" style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setEdit({ ...e })}
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            if (confirm('حذف این سند؟')) removeLedger(e.id)
                          }}
                        >
                          حذف
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
