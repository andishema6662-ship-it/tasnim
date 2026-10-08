import { useState } from 'react'
import { faDate } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'

export function BlockTickets() {
  const { platform, createComplexTicket } = useStore()
  const state = useBuildingState()
  const meta = platform.buildings.find((b) => b.id === state.buildingId)
  const isManager = state.session.role === 'manager'
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('تاسیسات')
  const [toast, setToast] = useState<string | null>(null)

  const mine = platform.admin.tickets.filter((t) => t.buildingId === state.buildingId)

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
        <h3>تیکت‌های این بلوک</h3>
        <div className="list">
          {mine.map((t) => {
            const person = (platform.admin.staff ?? []).find((s) => s.id === t.assignedPersonId)
            const team = platform.admin.teams.find((s) => s.id === t.assignedTeamId)
            return (
              <div className="list-item" key={t.id}>
                <div>
                  <div className="title">{t.title}</div>
                  <div className="sub">
                    {t.category} · {faDate(t.updatedAt)}
                    <br />
                    {t.body}
                    {person ? (
                      <>
                        <br />
                        ارجاع‌شده به: {person.name} ({person.specialty})
                      </>
                    ) : null}
                    {team ? (
                      <>
                        <br />
                        تیم: {team.name}
                      </>
                    ) : null}
                  </div>
                </div>
                <span
                  className={`badge ${
                    t.status === 'resolved' ? 'ok' : t.status === 'in_progress' ? 'warn' : 'danger'
                  }`}
                >
                  {t.status === 'open' ? 'باز' : t.status === 'in_progress' ? 'در جریان' : 'حل‌شده'}
                </span>
              </div>
            )
          })}
          {mine.length === 0 && <div className="empty">هنوز تیکتی نیست.</div>}
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
