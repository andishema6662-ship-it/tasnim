import { useMemo, useState } from 'react'
import { BackButton } from '../components/BackButton'
import { JalaliDateField } from '../components/JalaliDateField'
import { faDateTime, faNum, jalaliMonthName, toJalaliParts } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'
import type { ManagerReminder } from '../store/types'

type ViewMode = 'week' | 'month'

function startOfJalaliWeek(iso: string): string {
  const d = new Date(iso)
  // Saturday = start of Persian week (getDay: Sat=6)
  const day = d.getDay()
  const delta = (day + 1) % 7
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - delta)
  return d.toISOString()
}

export function Reminders() {
  const { upsertReminder, removeReminder } = useStore()
  const state = useBuildingState()
  const role = state.session.role
  const canEdit = role === 'manager' || role === 'financeManager'

  const [mode, setMode] = useState<ViewMode>('week')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dateIso, setDateIso] = useState(() => new Date().toISOString())
  const [time, setTime] = useState('09:00')

  const items = useMemo(
    () => [...state.reminders].sort((a, b) => +new Date(a.at) - +new Date(b.at)),
    [state.reminders],
  )

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; items: ManagerReminder[] }>()
    for (const r of items) {
      const p = toJalaliParts(r.at)
      if (!p) continue
      if (mode === 'month') {
        const key = `${p.jy}-${p.jm}`
        const label = `${jalaliMonthName(p.jm)} ${faNum(p.jy)}`
        if (!map.has(key)) map.set(key, { key, label, items: [] })
        map.get(key)!.items.push(r)
      } else {
        const weekStart = startOfJalaliWeek(r.at)
        const wp = toJalaliParts(weekStart)
        const key = weekStart.slice(0, 10)
        const label = wp
          ? `هفته ${faNum(wp.jd)} ${jalaliMonthName(wp.jm)}`
          : key
        if (!map.has(key)) map.set(key, { key, label, items: [] })
        map.get(key)!.items.push(r)
      }
    }
    return [...map.values()]
  }, [items, mode])

  if (!canEdit && role !== 'resident') {
    return (
      <div className="page">
        <BackButton />
        <h2>یادآوری‌ها</h2>
        <div className="empty">دسترسی ندارید.</div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <BackButton fallback="/app/more" />
      </div>
      <h2>یادآوری‌ها</h2>
      <p className="lead">تاریخ، ساعت، عنوان و توضیحات — لیست هفتگی / ماهانه شمسی.</p>

      <div className="chip-row admin-nav">
        <button
          type="button"
          className={`chip ${mode === 'week' ? 'active' : ''}`}
          onClick={() => setMode('week')}
        >
          هفته
        </button>
        <button
          type="button"
          className={`chip ${mode === 'month' ? 'active' : ''}`}
          onClick={() => setMode('month')}
        >
          ماه
        </button>
      </div>

      {canEdit && (
        <div className="panel">
          <h3>یادآوری جدید</h3>
          <div className="field">
            <label>عنوان</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <JalaliDateField label="تاریخ (شمسی)" valueIso={dateIso} onChangeIso={setDateIso} />
          <div className="field">
            <label>ساعت</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="field">
            <label>توضیحات</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => {
              if (!title.trim()) return
              const [hh, mm] = time.split(':').map(Number)
              const at = new Date(dateIso)
              at.setHours(hh || 0, mm || 0, 0, 0)
              upsertReminder({
                id: `rm-${Date.now()}`,
                title: title.trim(),
                description: description.trim(),
                at: at.toISOString(),
                createdAt: new Date().toISOString(),
              })
              setTitle('')
              setDescription('')
            }}
          >
            ثبت یادآوری
          </button>
        </div>
      )}

      {groups.map((g) => (
        <div className="panel" key={g.key}>
          <h3>{g.label}</h3>
          <div className="list">
            {g.items.map((r) => (
              <div key={r.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="title">{r.title}</div>
                  <div className="sub">
                    {faDateTime(r.at)}
                    {r.description ? (
                      <>
                        <br />
                        {r.description}
                      </>
                    ) : null}
                  </div>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      if (confirm('حذف این یادآوری؟')) removeReminder(r.id)
                    }}
                  >
                    حذف
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {groups.length === 0 && <div className="empty">یادآوری ثبت نشده.</div>}
    </div>
  )
}
