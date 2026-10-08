import { useMemo, useState } from 'react'
import { JalaliDateField } from '../components/JalaliDateField'
import {
  audiencesForRole,
  isBroadcastLive,
} from '../lib/broadcasts'
import { faDate, faDateTime } from '../lib/format'
import {
  BROADCAST_AUDIENCE_LABEL,
  type BroadcastAudience,
  type ManagerBroadcast,
  type StaffRole,
} from '../store/platformTypes'
import { useStore } from '../store/StoreContext'

function daysFromNow(d: number): string {
  return new Date(Date.now() + d * 86400000).toISOString()
}

export function BroadcastsPanel({
  role,
  complexId,
  buildingId,
  displayName,
}: {
  role: StaffRole
  complexId?: string
  buildingId?: string
  displayName: string
}) {
  const { platform, upsertBroadcast, deactivateBroadcast } = useStore()
  const allowed = audiencesForRole(role)
  const [form, setForm] = useState<ManagerBroadcast | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }

  const mine = useMemo(() => {
    return (platform.admin.broadcasts ?? [])
      .filter((b) => {
        if (role === 'siteAdmin') return true
        if (role === 'complexManager') {
          return b.complexId === complexId || b.createdByRole === 'complexManager'
        }
        return b.buildingId === buildingId || b.complexId === complexId
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [platform.admin.broadcasts, role, complexId, buildingId])

  const empty = (): ManagerBroadcast => ({
    id: `bc-${Date.now()}`,
    title: '',
    body: '',
    createdByRole: role,
    createdByName: displayName,
    complexId,
    buildingId: role === 'manager' ? buildingId : undefined,
    audience: allowed[0] ?? 'building_members',
    startsAt: new Date().toISOString(),
    endsAt: daysFromNow(3),
    createdAt: new Date().toISOString(),
    active: true,
  })

  if (allowed.length === 0) {
    return <div className="empty">این نقش مجاز به ارسال پیام مدیر نیست.</div>
  }

  return (
    <>
      <p className="lead">
        پیام به زیرمجموعه‌ها با بازه شمسی؛ تا پایان مهلت در اعلان‌ها و بنر خانه نمایش داده می‌شود.
      </p>
      <button
        type="button"
        className="btn btn-copper"
        style={{ width: '100%', marginBottom: 12 }}
        onClick={() => setForm(empty())}
      >
        پیام مدیر جدید
      </button>

      {form && (
        <div className="panel">
          <h3>ثبت پیام</h3>
          <div className="field">
            <label>عنوان</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="مثلاً قطع آب مشاعات"
            />
          </div>
          <div className="field">
            <label>متن</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={3}
            />
          </div>
          <div className="field">
            <label>مخاطب</label>
            <select
              value={form.audience}
              onChange={(e) =>
                setForm({ ...form, audience: e.target.value as BroadcastAudience })
              }
            >
              {allowed.map((a) => (
                <option key={a} value={a}>
                  {BROADCAST_AUDIENCE_LABEL[a]}
                </option>
              ))}
            </select>
          </div>
          {role === 'siteAdmin' && form.audience !== 'complex_managers' && (
            <div className="field">
              <label>شهرک (اختیاری برای محدودسازی)</label>
              <select
                value={form.complexId ?? ''}
                onChange={(e) =>
                  setForm({ ...form, complexId: e.target.value || undefined })
                }
              >
                <option value="">همه شهرک‌ها</option>
                {platform.admin.complexes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid-actions">
            <JalaliDateField
              label="شروع نمایش"
              valueIso={form.startsAt}
              onChangeIso={(iso) => setForm({ ...form, startsAt: iso })}
            />
            <JalaliDateField
              label="پایان نمایش"
              valueIso={form.endsAt}
              onChangeIso={(iso) => setForm({ ...form, endsAt: iso })}
            />
          </div>
          <div className="chip-row" style={{ marginBottom: 10 }}>
            {[1, 3, 7].map((d) => (
              <button
                key={d}
                type="button"
                className="chip"
                onClick={() =>
                  setForm({
                    ...form,
                    startsAt: new Date().toISOString(),
                    endsAt: daysFromNow(d),
                  })
                }
              >
                {d} روزه
              </button>
            ))}
          </div>
          <div className="grid-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>
              انصراف
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!form.title.trim() || !form.body.trim()) return
                if (+new Date(form.endsAt) < +new Date(form.startsAt)) {
                  flash('پایان باید بعد از شروع باشد')
                  return
                }
                upsertBroadcast({
                  ...form,
                  title: form.title.trim(),
                  body: form.body.trim(),
                  complexId: role === 'complexManager' ? complexId : form.complexId,
                  buildingId: role === 'manager' ? buildingId : form.buildingId,
                })
                setForm(null)
                flash('پیام ثبت شد و به اعلان‌ها ارسال شد')
              }}
            >
              ارسال
            </button>
          </div>
        </div>
      )}

      {mine.map((b) => {
        const live = isBroadcastLive(b)
        return (
          <div className="panel" key={b.id}>
            <div className="list-item" style={{ paddingTop: 0 }}>
              <div>
                <div className="title">{b.title}</div>
                <div className="sub">
                  {BROADCAST_AUDIENCE_LABEL[b.audience]} · {b.createdByName}
                  <br />
                  {faDate(b.startsAt)} تا {faDate(b.endsAt)}
                  <br />
                  ثبت: {faDateTime(b.createdAt)}
                  <br />
                  {b.body}
                </div>
              </div>
              <span className={`badge ${live ? 'ok' : 'soon'}`}>
                {live ? 'فعال' : b.active ? 'منقضی' : 'خاموش'}
              </span>
            </div>
            {b.active && live && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => {
                  deactivateBroadcast(b.id)
                  flash('پیام غیرفعال شد')
                }}
              >
                پایان زودهنگام
              </button>
            )}
          </div>
        )
      })}
      {mine.length === 0 && <div className="empty">هنوز پیامی ثبت نشده.</div>}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
