import { useState } from 'react'
import { faDate, toman } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'
import type { LedgerKind } from '../store/types'

export function Finance() {
  const { addLedger } = useStore()
  const state = useBuildingState()
  const [kind, setKind] = useState<LedgerKind>('expense')
  const [category, setCategory] = useState('نظافت')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState(500000)
  const [note, setNote] = useState('')
  const [visible, setVisible] = useState(true)

  if (state.session?.role !== 'manager') {
    return (
      <div className="page">
        <h2>مالی</h2>
        <p className="lead">گزارش مدیر فقط برای نقش مدیر در دسترس است. شفافیت هزینه‌ها را از بخش هزینه‌ها ببینید.</p>
      </div>
    )
  }

  const debtors = state.units.filter((u) => u.balance < 0)
  const creditors = state.units.filter((u) => u.balance > 0)

  return (
    <div className="page">
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
        <div className="list">
          {state.units.map((u) => (
            <div className="list-item" key={u.id}>
              <div>
                <div className="title">واحد {u.number}</div>
                <div className="sub">{toman(u.balance)}</div>
              </div>
              <span className={`badge ${u.balance < 0 ? 'danger' : u.balance > 0 ? 'ok' : ''}`}>
                {u.balance < 0 ? 'بدهکار' : u.balance > 0 ? 'بستانکار' : 'تسویه'}
              </span>
            </div>
          ))}
        </div>
        {creditors.length === 0 && debtors.length === 0 && null}
      </div>

      <div className="panel">
        <h3>ثبت سند</h3>
        <div className="field">
          <label>نوع</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as LedgerKind)}>
            <option value="expense">هزینه</option>
            <option value="income">درآمد</option>
          </select>
        </div>
        <div className="field">
          <label>دسته</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="field">
          <label>عنوان</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>مبلغ</label>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>توضیح</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: '0.9rem' }}>
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          نمایش برای ساکنین (شفافیت)
        </label>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={() => {
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
          ثبت در دفتر
        </button>
      </div>

      <div className="panel">
        <h3>گزارش اخیر</h3>
        <div className="list">
          {state.ledger.slice(0, 8).map((e) => (
            <div className="list-item" key={e.id}>
              <div>
                <div className="title">{e.title}</div>
                <div className="sub">
                  {e.category} · {faDate(e.createdAt)}
                  {!e.visibleToResidents && ' · داخلی'}
                </div>
              </div>
              <span className={`badge ${e.kind === 'income' ? 'ok' : 'warn'}`}>
                {e.kind === 'income' ? '+' : '−'}
                {toman(e.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
