import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { faDateTime, toman } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'
import {
  BUILDING_FUND_KIND_LABEL,
  PAYMENT_METHOD_LABEL,
  type BuildingFund,
  type BuildingFundKind,
  type LedgerEntry,
  type LedgerKind,
  type PaymentMethod,
} from '../store/types'

type FinTab =
  | 'status'
  | 'charges'
  | 'receipts'
  | 'expenses'
  | 'commitments'
  | 'income'

const TABS: { id: FinTab; label: string }[] = [
  { id: 'status', label: 'صورت وضعیت' },
  { id: 'charges', label: 'شارژ و بدهی' },
  { id: 'receipts', label: 'دریافتی‌ها' },
  { id: 'expenses', label: 'هزینه‌ها' },
  { id: 'commitments', label: 'تعهدات مالی' },
  { id: 'income', label: 'درآمدها' },
]

export function Finance() {
  const {
    addLedger,
    updateLedger,
    removeLedger,
    upsertBuildingFund,
    removeBuildingFund,
    confirmManagerAccount,
  } = useStore()
  const state = useBuildingState()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as FinTab) || 'status'
  const setTab = (id: FinTab) => setParams({ tab: id }, { replace: true })

  const [kind, setKind] = useState<LedgerKind>('expense')
  const [category, setCategory] = useState('نظافت')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState(500000)
  const [note, setNote] = useState('')
  const [visible, setVisible] = useState(true)
  const [fundId, setFundId] = useState(state.funds[0]?.id ?? '')
  const [edit, setEdit] = useState<LedgerEntry | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [fundForm, setFundForm] = useState<BuildingFund | null>(null)

  const role = state.session?.role
  if (role !== 'manager' && role !== 'financeManager') {
    return (
      <div className="page">
        <h2>مالی</h2>
        <p className="lead">گزارش مدیر فقط برای نقش مدیر در دسترس است.</p>
      </div>
    )
  }

  const isManager = role === 'manager'
  const debtors = state.units.filter((u) => u.balance < 0)
  const expenses = state.ledger.filter((e) => e.kind === 'expense')
  const incomes = state.ledger.filter((e) => e.kind === 'income')
  const unpaidBills = state.bills.filter((b) => b.status !== 'paid')

  const detailFor = (e: LedgerEntry) => {
    const pay = e.paymentId
      ? state.payments.find((p) => p.id === e.paymentId)
      : state.payments.find((p) => e.trackingCode && p.trackingCode === e.trackingCode)
    const method = (e.method ?? pay?.method) as PaymentMethod | undefined
    return {
      method,
      bank: e.bankName ?? pay?.bankName,
      tracking: e.trackingCode ?? pay?.trackingCode,
    }
  }

  const saveLedger = () => {
    if (edit) {
      if (!edit.title.trim()) return
      updateLedger({ ...edit, title: edit.title.trim() })
      setEdit(null)
      return
    }
    if (!title.trim()) return
    const entryKind: LedgerKind =
      tab === 'expenses' ? 'expense' : tab === 'income' ? 'income' : kind
    addLedger({
      kind: entryKind,
      category,
      title: title.trim(),
      amount,
      note,
      visibleToResidents: visible,
      fundId: fundId || undefined,
    })
    setTitle('')
    setNote('')
  }

  return (
    <div className="page">
      <div className="page-head">
        <BackButton fallback="/app" />
      </div>
      <h2>مدیریت مالی</h2>
      <p className="lead">صورت وضعیت، شارژ، دریافتی، هزینه، تعهدات و درآمد — چند صندوق.</p>

      <div className="chip-row admin-nav finance-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'status' && (
        <>
          <div className="stat-row">
            <div className="stat">
              <span className="label">جمع صندوق‌ها</span>
              <span className="value">{toman(state.fundBalance)}</span>
            </div>
            <div className="stat">
              <span className="label">بدهکار</span>
              <span className="value">{debtors.length}</span>
            </div>
          </div>
          <div className="panel">
            <div className="page-head">
              <h3 style={{ margin: 0 }}>صندوق‌ها</h3>
              {isManager && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', minHeight: 36 }}
                  onClick={() =>
                    setFundForm({
                      id: '',
                      name: '',
                      kind: 'custom',
                      balance: 0,
                      createdAt: new Date().toISOString(),
                    })
                  }
                >
                  صندوق جدید
                </button>
              )}
            </div>
            <div className="list list-grid-2">
              {state.funds.map((f) => (
                <div className="list-item" key={f.id}>
                  <div>
                    <div className="title">{f.name}</div>
                    <div className="sub">{BUILDING_FUND_KIND_LABEL[f.kind]}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span className="badge ok">{toman(f.balance)}</span>
                    {isManager && (
                      <div className="grid-actions" style={{ marginTop: 6 }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setFundForm({ ...f })}
                        >
                          ویرایش
                        </button>
                        {f.kind === 'custom' && (
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => {
                              if (confirm('حذف صندوق؟')) removeBuildingFund(f.id)
                            }}
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isManager &&
              state.funds.some((f) => f.kind === 'charge') &&
              state.funds.some((f) => f.kind === 'operating') &&
              !state.managerOnboarding?.accountConfirmed && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 12 }}
                  onClick={() => confirmManagerAccount()}
                >
                  تأیید حساب بلوک (صندوق شارژ + جاری)
                </button>
              )}
          </div>
          {fundForm && isManager && (
            <div className="panel">
              <h3>{fundForm.id ? 'ویرایش صندوق' : 'صندوق جدید'}</h3>
              <div className="field">
                <label>نام</label>
                <input
                  value={fundForm.name}
                  onChange={(e) => setFundForm({ ...fundForm, name: e.target.value })}
                  placeholder="مثلاً صندوق آسانسور"
                />
              </div>
              <div className="field">
                <label>نوع</label>
                <select
                  value={fundForm.kind}
                  onChange={(e) =>
                    setFundForm({ ...fundForm, kind: e.target.value as BuildingFundKind })
                  }
                  disabled={Boolean(fundForm.id) && fundForm.kind !== 'custom'}
                >
                  <option value="charge">{BUILDING_FUND_KIND_LABEL.charge}</option>
                  <option value="operating">{BUILDING_FUND_KIND_LABEL.operating}</option>
                  <option value="custom">{BUILDING_FUND_KIND_LABEL.custom}</option>
                </select>
              </div>
              <div className="field">
                <label>مانده (تومان)</label>
                <input
                  type="number"
                  value={fundForm.balance}
                  onChange={(e) =>
                    setFundForm({ ...fundForm, balance: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="grid-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setFundForm(null)}>
                  انصراف
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const name =
                      fundForm.name.trim() ||
                      BUILDING_FUND_KIND_LABEL[fundForm.kind]
                    upsertBuildingFund({
                      ...fundForm,
                      id: fundForm.id || `fund-${Date.now()}`,
                      name,
                      createdAt: fundForm.id ? fundForm.createdAt : new Date().toISOString(),
                    })
                    setFundForm(null)
                  }}
                >
                  ذخیره
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'charges' && (
        <div className="panel">
          <h3>شارژ و بدهی واحدها</h3>
          <p className="sub" style={{ marginTop: 0 }}>
            برای گزارش بدهی روی واحد بزنید.
          </p>
          <div className="list list-grid-2">
            {state.units.map((u) => (
              <Link className="list-item list-item--link" key={u.id} to={`/app/debt/${u.id}`}>
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
          <Link className="btn btn-secondary" to="/app/charges" style={{ width: '100%', marginTop: 12 }}>
            تنظیم زمان‌بندی شارژ
          </Link>
        </div>
      )}

      {tab === 'receipts' && (
        <div className="panel">
          <h3>دریافتی‌ها (پرداخت واحدها)</h3>
          <div className="list list-grid-2">
            {state.payments.slice(0, 20).map((p) => {
              const u = state.units.find((x) => x.id === p.unitId)
              return (
                <div className="list-item" key={p.id}>
                  <div>
                    <div className="title">
                      واحد {u?.number ?? '—'} — {toman(p.amount)}
                    </div>
                    <div className="sub">
                      {faDateTime(p.createdAt)} · {PAYMENT_METHOD_LABEL[p.method]}
                      <br />
                      {p.bankName || '—'} · کد {p.trackingCode}
                    </div>
                  </div>
                  <span className="badge ok">دریافت</span>
                </div>
              )
            })}
            {state.payments.length === 0 && <div className="empty">دریافتی ثبت نشده.</div>}
          </div>
        </div>
      )}

      {(tab === 'expenses' || tab === 'income') && (
        <>
          {isManager && (
            <div className="panel">
              <h3>{edit ? 'ویرایش سند' : tab === 'expenses' ? 'ثبت هزینه' : 'ثبت درآمد'}</h3>
              {!edit && (
                <div className="field">
                  <label>نوع</label>
                  <select
                    value={tab === 'expenses' ? 'expense' : kind === 'expense' ? 'income' : kind}
                    onChange={(e) => setKind(e.target.value as LedgerKind)}
                    disabled={tab === 'expenses' || tab === 'income'}
                  >
                    <option value="expense">هزینه</option>
                    <option value="income">درآمد</option>
                  </select>
                </div>
              )}
              <div className="field">
                <label>صندوق</label>
                <select
                  value={edit?.fundId ?? fundId}
                  onChange={(e) =>
                    edit
                      ? setEdit({ ...edit, fundId: e.target.value })
                      : setFundId(e.target.value)
                  }
                >
                  {state.funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
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
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 12,
                  fontSize: '0.9rem',
                }}
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
                نمایش برای ساکنین
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
                  style={{ gridColumn: edit ? undefined : '1 / -1' }}
                  onClick={() => {
                    if (!edit) {
                      setKind(tab === 'expenses' ? 'expense' : 'income')
                    }
                    // ensure kind matches tab when creating
                    if (!edit && tab === 'expenses') setKind('expense')
                    if (!edit && tab === 'income') setKind('income')
                    setTimeout(saveLedger, 0)
                    if (!edit) {
                      addLedger({
                        kind: tab === 'expenses' ? 'expense' : 'income',
                        category,
                        title: title.trim(),
                        amount,
                        note,
                        visibleToResidents: visible,
                        fundId: fundId || undefined,
                      })
                      setTitle('')
                      setNote('')
                    } else {
                      saveLedger()
                    }
                  }}
                >
                  {edit ? 'ذخیره' : 'ثبت'}
                </button>
              </div>
            </div>
          )}
          <LedgerList
            rows={tab === 'expenses' ? expenses : incomes}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            detailFor={detailFor}
            isManager={isManager}
            onEdit={setEdit}
            onRemove={removeLedger}
            funds={state.funds}
          />
        </>
      )}

      {tab === 'commitments' && (
        <div className="panel">
          <h3>تعهدات مالی (قبوض باز)</h3>
          <div className="list list-grid-2">
            {unpaidBills.map((b) => {
              const u = state.units.find((x) => x.id === b.unitId)
              const due = b.total - b.paidOwner - b.paidResident
              return (
                <div className="list-item" key={b.id}>
                  <div>
                    <div className="title">
                      واحد {u?.number} — {b.title}
                    </div>
                    <div className="sub">
                      {b.periodLabel} · مانده {toman(due)}
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'partial' ? 'warn' : 'danger'}`}>
                    {b.status === 'partial' ? 'ناقص' : 'پرداخت‌نشده'}
                  </span>
                </div>
              )
            })}
            {unpaidBills.length === 0 && <div className="empty">تعهد باز نیست.</div>}
          </div>
          <Link className="btn btn-secondary" to="/app/bills" style={{ width: '100%', marginTop: 12 }}>
            مدیریت قبوض
          </Link>
        </div>
      )}
    </div>
  )
}

function LedgerList({
  rows,
  expandedId,
  setExpandedId,
  detailFor,
  isManager,
  onEdit,
  onRemove,
  funds,
}: {
  rows: LedgerEntry[]
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  detailFor: (e: LedgerEntry) => {
    method?: PaymentMethod
    bank?: string
    tracking?: string
  }
  isManager: boolean
  onEdit: (e: LedgerEntry) => void
  onRemove: (id: string) => void
  funds: BuildingFund[]
}) {
  const fundName = useMemo(
    () => Object.fromEntries(funds.map((f) => [f.id, f.name])),
    [funds],
  )
  return (
    <div className="panel">
      <h3>فهرست</h3>
      <div className="list list-grid-2">
        {rows.slice(0, 20).map((e) => {
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
                    {e.category}
                    {e.fundId ? ` · ${fundName[e.fundId] ?? ''}` : ''} · {faDateTime(e.createdAt)}
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
                    {method
                      ? PAYMENT_METHOD_LABEL[method]
                      : e.kind === 'expense'
                        ? '— (هزینه)'
                        : 'ثبت دستی'}
                  </div>
                  <div>
                    <strong>بانک / حساب:</strong> {bank || '—'}
                  </div>
                  <div>
                    <strong>کد رهگیری:</strong> {tracking || '—'}
                  </div>
                  {isManager && (
                    <div className="grid-actions" style={{ marginTop: 10 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => onEdit(e)}>
                        ویرایش
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          if (confirm('حذف؟')) onRemove(e.id)
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
        {rows.length === 0 && <div className="empty">موردی نیست.</div>}
      </div>
    </div>
  )
}
