import { useMemo, useState } from 'react'
import { JalaliDateField } from '../components/JalaliDateField'
import { resolveProgramStatus } from '../lib/broadcasts'
import { faDate } from '../lib/format'
import {
  SIDE_PROGRAM_TYPE_LABEL,
  type SideProgram,
  type SideProgramScope,
  type SideProgramType,
  type StaffRole,
} from '../store/platformTypes'
import { useStore } from '../store/StoreContext'

const STATUS_LABEL = {
  upcoming: 'به‌زودی',
  active: 'فعال',
  ended: 'پایان‌یافته',
} as const

export function SideProgramsPanel({
  role,
  complexId,
  buildingId,
  displayName,
  /** When true, only list (residents). */
  readOnly = false,
}: {
  role: StaffRole | 'resident'
  complexId?: string
  buildingId?: string
  displayName: string
  readOnly?: boolean
}) {
  const { platform, upsertSideProgram, removeSideProgram } = useStore()
  const [form, setForm] = useState<SideProgram | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }

  const canManage =
    !readOnly && (role === 'complexManager' || role === 'manager' || role === 'siteAdmin')

  const defaultScope: SideProgramScope =
    role === 'manager' ? 'building' : 'complex'

  const list = useMemo(() => {
    return (platform.admin.sidePrograms ?? [])
      .filter((p) => {
        if (role === 'siteAdmin') return true
        if (buildingId && p.buildingId === buildingId) return true
        if (complexId && p.complexId === complexId) return true
        if (buildingId) {
          const meta = platform.buildings.find((b) => b.id === buildingId)
          if (p.scope === 'complex' && p.complexId && meta?.complexId === p.complexId) {
            return true
          }
        }
        return false
      })
      .map((p) => ({
        ...p,
        status: resolveProgramStatus(p.startsAt, p.endsAt),
      }))
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
  }, [platform.admin.sidePrograms, platform.buildings, role, complexId, buildingId])

  const empty = (): SideProgram => ({
    id: `prg-${Date.now()}`,
    scope: defaultScope,
    complexId,
    buildingId: defaultScope === 'building' ? buildingId : undefined,
    title: '',
    type: 'cultural',
    description: '',
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdByName: displayName,
    createdByRole: role === 'resident' ? 'manager' : role,
    status: 'upcoming',
  })

  return (
    <>
      <p className="lead">
        برنامه‌های جانبی شهرک و بلوک — فروشگاه، فرهنگی، اطلاع‌رسانی و برنامه‌های ثابت.
      </p>

      {canManage && (
        <button
          type="button"
          className="btn btn-copper"
          style={{ width: '100%', marginBottom: 12 }}
          onClick={() => setForm(empty())}
        >
          ثبت برنامه جدید
        </button>
      )}

      {form && canManage && (
        <div className="panel">
          <h3>برنامه جانبی</h3>
          {(role === 'siteAdmin' || role === 'complexManager') && (
            <div className="field">
              <label>سطح</label>
              <select
                value={form.scope}
                onChange={(e) => {
                  const scope = e.target.value as SideProgramScope
                  setForm({
                    ...form,
                    scope,
                    buildingId: scope === 'building' ? buildingId ?? platform.buildings[0]?.id : undefined,
                    complexId: complexId ?? form.complexId,
                  })
                }}
              >
                <option value="complex">سطح شهرک</option>
                <option value="building">سطح بلوک / ساختمان</option>
              </select>
            </div>
          )}
          {form.scope === 'building' && role !== 'manager' && (
            <div className="field">
              <label>ساختمان</label>
              <select
                value={form.buildingId ?? ''}
                onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
              >
                {platform.buildings
                  .filter((b) => !complexId || b.complexId === complexId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div className="field">
            <label>عنوان</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="field">
            <label>نوع</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as SideProgramType })}
            >
              {(Object.keys(SIDE_PROGRAM_TYPE_LABEL) as SideProgramType[]).map((t) => (
                <option key={t} value={t}>
                  {SIDE_PROGRAM_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>توضیح</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid-actions">
            <JalaliDateField
              label="شروع (شمسی)"
              valueIso={form.startsAt}
              onChangeIso={(iso) => setForm({ ...form, startsAt: iso })}
            />
            <JalaliDateField
              label="پایان (شمسی)"
              valueIso={form.endsAt ?? form.startsAt}
              onChangeIso={(iso) => setForm({ ...form, endsAt: iso })}
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
                if (!form.title.trim()) return
                upsertSideProgram({
                  ...form,
                  title: form.title.trim(),
                  description: form.description.trim(),
                  complexId:
                    form.scope === 'complex'
                      ? complexId ?? form.complexId
                      : platform.buildings.find((b) => b.id === form.buildingId)?.complexId ??
                        form.complexId,
                })
                setForm(null)
                flash('برنامه ذخیره شد')
              }}
            >
              ذخیره
            </button>
          </div>
        </div>
      )}

      {list.map((p) => (
        <div className="panel" key={p.id}>
          <div className="list-item" style={{ paddingTop: 0 }}>
            <div>
              <div className="title">{p.title}</div>
              <div className="sub">
                {SIDE_PROGRAM_TYPE_LABEL[p.type]} ·{' '}
                {p.scope === 'complex' ? 'شهرک' : 'بلوک'}
                <br />
                {faDate(p.startsAt)}
                {p.endsAt ? ` تا ${faDate(p.endsAt)}` : ''}
                <br />
                {p.description}
                <br />
                ثبت‌کننده: {p.createdByName}
              </div>
            </div>
            <span
              className={`badge ${
                p.status === 'active' ? 'ok' : p.status === 'upcoming' ? 'warn' : 'soon'
              }`}
            >
              {STATUS_LABEL[p.status]}
            </span>
          </div>
          {canManage && (role === 'siteAdmin' || p.createdByRole === role || role === 'complexManager') && (
            <div className="grid-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setForm({ ...p })}
              >
                ویرایش
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (confirm(`حذف «${p.title}»؟`)) {
                    removeSideProgram(p.id)
                    flash('حذف شد')
                  }
                }}
              >
                حذف
              </button>
            </div>
          )}
        </div>
      ))}
      {list.length === 0 && <div className="empty">برنامه‌ای ثبت نشده.</div>}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
