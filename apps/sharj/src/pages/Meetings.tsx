import { useMemo, useState } from 'react'
import { faDateTime, toLocalInput } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'
import type { Meeting, MeetingAttendee } from '../store/types'

function emptyForm(defaults?: Partial<Meeting>): {
  id: string
  title: string
  scheduledAt: string
  place: string
  agenda: string
  resolutionsText: string
  status: Meeting['status']
  selectedResidentIds: string[]
  freeNames: string
} {
  return {
    id: defaults?.id ?? '',
    title: defaults?.title ?? '',
    scheduledAt: defaults?.scheduledAt
      ? toLocalInput(defaults.scheduledAt)
      : toLocalInput(new Date(Date.now() + 3 * 86400000).toISOString()),
    place: defaults?.place ?? '',
    agenda: defaults?.agenda ?? '',
    resolutionsText: (defaults?.resolutions ?? []).join('\n'),
    status: defaults?.status ?? 'upcoming',
    selectedResidentIds: (defaults?.attendees ?? [])
      .map((a) => a.residentId)
      .filter((x): x is string => Boolean(x)),
    freeNames: (defaults?.attendees ?? [])
      .filter((a) => !a.residentId)
      .map((a) => a.name)
      .join('\n'),
  }
}

export function Meetings() {
  const { upsertMeeting, notifyMeeting } = useStore()
  const state = useBuildingState()
  const isManager = state.session?.role === 'manager'
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(() => emptyForm())
  const [toast, setToast] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = useMemo(
    () =>
      [...state.meetings].sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      ),
    [state.meetings],
  )

  const upcoming = sorted.filter((m) => m.status === 'upcoming')
  const past = sorted.filter((m) => m.status === 'done')

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (m: Meeting) => {
    setEditingId(m.id)
    setForm(emptyForm(m))
    setShowForm(true)
  }

  const buildAttendees = (): MeetingAttendee[] => {
    const fromResidents: MeetingAttendee[] = form.selectedResidentIds.map((rid) => {
      const r = state.residents.find((x) => x.id === rid)!
      return {
        id: `att-${rid}`,
        name: r.name,
        residentId: r.id,
        unitId: r.unitId,
      }
    })
    const free: MeetingAttendee[] = form.freeNames
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name, i) => ({
        id: `free-${i}-${name}`,
        name,
      }))
    return [...fromResidents, ...free]
  }

  const save = () => {
    if (!form.title.trim() || !form.scheduledAt) return
    const iso = new Date(form.scheduledAt).toISOString()
    const resolutions = form.resolutionsText
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean)
    const now = new Date().toISOString()
    const existing = editingId ? state.meetings.find((m) => m.id === editingId) : undefined
    const meeting: Meeting = {
      id: editingId ?? `m-${Date.now()}`,
      title: form.title.trim(),
      scheduledAt: iso,
      place: form.place.trim() || undefined,
      agenda: form.agenda.trim() || undefined,
      resolutions,
      attendees: buildAttendees(),
      notifiedAt: existing?.notifiedAt,
      status: form.status,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    upsertMeeting(meeting)
    setShowForm(false)
    setEditingId(null)
    setToast('جلسه ذخیره شد')
    setTimeout(() => setToast(null), 2200)
  }

  const renderMeeting = (m: Meeting) => {
    const unitLabel = (unitId?: string) => {
      if (!unitId) return null
      const u = state.units.find((x) => x.id === unitId)
      return u ? `واحد ${u.number}` : null
    }
    const open = expandedId === m.id
    return (
      <div className="panel" key={m.id}>
        <div className="list-item" style={{ paddingTop: 0 }}>
          <div>
            <div className="title">{m.title}</div>
            <div className="sub">
              {faDateTime(m.scheduledAt)}
              {m.place ? ` · ${m.place}` : ''}
              {m.agenda ? (
                <>
                  <br />
                  موضوع: {m.agenda}
                </>
              ) : null}
            </div>
          </div>
          <span className={`badge ${m.status === 'upcoming' ? 'warn' : 'ok'}`}>
            {m.status === 'upcoming' ? 'آتی' : 'برگزارشده'}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setExpandedId(open ? null : m.id)}
        >
          {open ? 'بستن جزئیات' : 'مصوبات و حاضرین'}
        </button>

        {open && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ margin: '8px 0' }}>مصوبات</h3>
            {m.resolutions.length === 0 ? (
              <div className="sub">هنوز مصوبه‌ای ثبت نشده.</div>
            ) : (
              <ol style={{ margin: '0 0 12px', paddingInlineStart: 22, lineHeight: 1.7 }}>
                {m.resolutions.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ol>
            )}
            <h3 style={{ margin: '8px 0' }}>حاضرین ({m.attendees.length})</h3>
            {m.attendees.length === 0 ? (
              <div className="sub">فهرست حاضرین خالی است.</div>
            ) : (
              <div className="list">
                {m.attendees.map((a) => (
                  <div className="list-item" key={a.id}>
                    <div>
                      <div className="title">{a.name}</div>
                      <div className="sub">{unitLabel(a.unitId) ?? (a.residentId ? 'ساکن' : 'مهمان / دستی')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {m.notifiedAt && (
              <div className="sub" style={{ marginTop: 8 }}>
                آخرین اطلاع‌رسانی درون‌برنامه‌ای: {faDateTime(m.notifiedAt)}
              </div>
            )}
          </div>
        )}

        {isManager && (
          <div className="grid-actions" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => openEdit(m)}>
              ویرایش
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                notifyMeeting(m.id)
                setToast('اعلان جلسه برای ساکنین ثبت شد (پیامک به‌زودی)')
                setTimeout(() => setToast(null), 2800)
              }}
            >
              اطلاع‌رسانی
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <h2>جلسات و مصوبات</h2>
      <p className="lead">
        زمان‌بندی جلسه، اطلاع‌رسانی به ساکنین، ثبت مصوبات و فهرست حاضرین.
      </p>

      {isManager && (
        <button type="button" className="btn btn-copper" style={{ width: '100%', marginBottom: 14 }} onClick={openCreate}>
          ثبت جلسه جدید
        </button>
      )}

      {showForm && isManager && (
        <div className="panel">
          <h3>{editingId ? 'ویرایش جلسه' : 'جلسه جدید'}</h3>
          <div className="field">
            <label>عنوان جلسه</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="field">
            <label>تاریخ و ساعت</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
          </div>
          <div className="field">
            <label>محل (اختیاری)</label>
            <input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />
          </div>
          <div className="field">
            <label>موضوع / دستور جلسه (اختیاری)</label>
            <input value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
          </div>
          <div className="field">
            <label>وضعیت</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Meeting['status'] })}
            >
              <option value="upcoming">آتی / اعلام‌شده</option>
              <option value="done">برگزارشده</option>
            </select>
          </div>
          <div className="field">
            <label>مصوبات (هر خط یک مصوبه)</label>
            <textarea
              value={form.resolutionsText}
              onChange={(e) => setForm({ ...form, resolutionsText: e.target.value })}
              placeholder="مثال: قرارداد نظافت تمدید شود"
            />
          </div>
          <div className="field">
            <label>حاضرین از فهرست ساکنین</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflow: 'auto' }}>
              {state.residents.map((r) => {
                const unit = state.units.find((u) => u.id === r.unitId)
                const checked = form.selectedResidentIds.includes(r.id)
                return (
                  <label key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          selectedResidentIds: e.target.checked
                            ? [...form.selectedResidentIds, r.id]
                            : form.selectedResidentIds.filter((id) => id !== r.id),
                        })
                      }}
                    />
                    {r.name}
                    <span className="sub">· واحد {unit?.number}</span>
                  </label>
                )
              })}
            </div>
          </div>
          <div className="field">
            <label>اسامی دستی / مهمان (هر خط یک نام)</label>
            <textarea
              value={form.freeNames}
              onChange={(e) => setForm({ ...form, freeNames: e.target.value })}
              placeholder="نام مهمان یا فرد خارج از فهرست"
            />
          </div>
          <div className="grid-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              انصراف
            </button>
            <button type="button" className="btn btn-primary" onClick={save}>
              ذخیره
            </button>
          </div>
        </div>
      )}

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', margin: '8px 0 10px' }}>جلسات پیش‌رو</h3>
      {upcoming.length === 0 ? <div className="empty">جلسهٔ آتی‌ای ثبت نشده.</div> : upcoming.map(renderMeeting)}

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', margin: '18px 0 10px' }}>جلسات گذشته</h3>
      {past.length === 0 ? <div className="empty">جلسه‌ای در آرشیو نیست.</div> : past.map(renderMeeting)}

      <div className="panel" style={{ marginTop: 8 }}>
        <h3>پیامک</h3>
        <p className="sub" style={{ margin: '0 0 8px' }}>
          اطلاع‌رسانی فعلی درون‌برنامه‌ای است؛ پیامک واقعی پس از اتصال درگاه فعال می‌شود.
        </p>
        <span className="badge soon">پیامک — به‌زودی</span>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
