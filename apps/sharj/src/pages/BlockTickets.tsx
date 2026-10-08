import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RequestsDataTable } from '../components/RequestsDataTable'
import { faDate } from '../lib/format'
import type { ComplexTicket } from '../store/platformTypes'
import { useBuildingState, useStore } from '../store/StoreContext'

const statusLabel = {
  open: 'باز',
  in_progress: 'در جریان',
  resolved: 'حل‌شده',
} as const

export function BlockTickets() {
  const { platform, createComplexTicket } = useStore()
  const state = useBuildingState()
  const meta = platform.buildings.find((b) => b.id === state.buildingId)
  const isManager = state.session.role === 'manager'
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('تاسیسات')
  const [toast, setToast] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const mine = useMemo(
    () => platform.admin.tickets.filter((t) => t.buildingId === state.buildingId),
    [platform.admin.tickets, state.buildingId],
  )

  const rows = useMemo(
    () =>
      mine.filter((t) => (statusFilter === 'all' ? true : t.status === statusFilter)),
    [mine, statusFilter],
  )

  if (!isManager) {
    return (
      <div className="page">
        <h2>تیکت شهرک</h2>
        <p className="lead">ارسال مشکل به مدیر شهرک فقط برای مدیر بلوک است.</p>
      </div>
    )
  }

  if (!meta?.complexId) {
    return (
      <div className="page">
        <h2>تیکت شهرک</h2>
        <p className="lead">این ساختمان به شهرکی وصل نیست.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h2>ارجاع به مدیر شهرک</h2>
      <p className="lead">مشکلات و نقطه‌نظرات بلوک برای ارجاع تیم فنی شهرک.</p>

      <div className="panel">
        <h3>تیکت جدید</h3>
        <div className="field">
          <label>دسته</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {['آسانسور', 'برق', 'نظافت', 'تاسیسات', 'امنیت', 'سایر'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>عنوان</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>شرح</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={() => {
            if (!title.trim() || !body.trim()) return
            const id = createComplexTicket({ title, body, category })
            if (id) {
              setTitle('')
              setBody('')
              setToast('تیکت برای مدیر شهرک ارسال شد')
              setTimeout(() => setToast(null), 2500)
            }
          }}
        >
          ارسال به شهرک
        </button>
      </div>

      <div className="panel">
        <RequestsDataTable
          title="جدول درخواست‌های این بلوک"
          rows={rows}
          rowKey={(t) => t.id}
          statusFilters={[
            { id: 'all', label: 'همه' },
            { id: 'open', label: 'باز' },
            { id: 'in_progress', label: 'در جریان' },
            { id: 'resolved', label: 'حل‌شده' },
          ]}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          columns={[
            {
              key: 'title',
              label: 'عنوان',
              render: (t: ComplexTicket) => t.title,
              searchText: (t) => `${t.title} ${t.body}`,
            },
            {
              key: 'cat',
              label: 'دسته',
              render: (t) => t.category,
              searchText: (t) => t.category,
            },
            {
              key: 'status',
              label: 'وضعیت',
              render: (t) => (
                <span
                  className={`badge ${
                    t.status === 'resolved'
                      ? 'ok'
                      : t.status === 'in_progress'
                        ? 'warn'
                        : 'danger'
                  }`}
                >
                  {statusLabel[t.status]}
                </span>
              ),
              searchText: (t) => statusLabel[t.status],
            },
            {
              key: 'at',
              label: 'تاریخ',
              render: (t) => faDate(t.updatedAt),
              searchText: (t) => t.updatedAt,
            },
          ]}
        />
      </div>

      <div className="panel">
        <h3>افزونه‌های قفل‌شده</h3>
        <p className="sub">اگر بخشی در منو باز نمی‌شود، از مسیر فعال‌سازی اقدام کنید.</p>
        <Link className="btn btn-copper" to="/app/activate/qarz" style={{ width: '100%' }}>
          برای فعال‌سازی کلیک کنید — قرض‌الحسنه
        </Link>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
