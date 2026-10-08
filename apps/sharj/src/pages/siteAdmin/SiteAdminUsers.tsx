import { useMemo, useState } from 'react'
import { faNum } from '../../lib/format'
import { roleLabel } from '../../lib/rbac'
import {
  SITE_USER_FILTER_LABEL,
  type PlatformUser,
  type SiteUserFilter,
  type StaffRole,
} from '../../store/platformTypes'
import { buildingTypeLabel } from '../../store/types'
import { useStore } from '../../store/StoreContext'

function managerSubtype(
  user: PlatformUser,
  buildings: { id: string; type: string }[],
): SiteUserFilter | null {
  if (user.role === 'complexManager') return 'complexManager'
  if (user.role === 'financeManager') return 'financeManager'
  if (user.role === 'siteAdmin') return 'siteAdmin'
  if (user.role !== 'manager') return null
  const b = buildings.find((x) => x.id === user.buildingId)
  if (!b) return 'buildingManager'
  if (b.type === 'block') return 'blockManager'
  if (b.type === 'tower') return 'towerManager'
  return 'buildingManager'
}

function filterLabel(user: PlatformUser, buildings: { id: string; type: string; name: string }[]) {
  const sub = managerSubtype(user, buildings)
  if (sub === 'blockManager') return 'مدیر بلوک'
  if (sub === 'towerManager') return 'مدیر برج'
  if (sub === 'buildingManager') return 'مدیر ساختمان'
  return roleLabel[user.role]
}

const FILTERS: SiteUserFilter[] = [
  'all',
  'complexManager',
  'blockManager',
  'buildingManager',
  'towerManager',
]

export function SiteAdminUsers({ onFlash }: { onFlash: (m: string) => void }) {
  const { platform, upsertUser } = useStore()
  const [filter, setFilter] = useState<SiteUserFilter>('all')
  const [q, setQ] = useState('')
  const [userForm, setUserForm] = useState<PlatformUser | null>(null)

  const emptyUser = (): PlatformUser => ({
    id: `usr-${Date.now()}`,
    username: '',
    password: '',
    role: 'manager',
    displayName: '',
    buildingId: platform.buildings[0]?.id,
    status: 'active',
  })

  const filtered = useMemo(() => {
    const users = platform.admin.users ?? []
    return users.filter((u) => {
      const sub = managerSubtype(u, platform.buildings)
      if (filter !== 'all' && sub !== filter) return false
      if (!q.trim()) return true
      const hay = `${u.displayName} ${u.username} ${u.phone ?? ''}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })
  }, [platform.admin.users, platform.buildings, filter, q])

  return (
    <>
      <p className="lead">
        فهرست مدیران با فیلتر نقش — الهام از چیدمان کارت مخاطبین (بدون کپی proprietary).
      </p>

      <div className="sa-contact-toolbar">
        <input
          className="sa-search"
          placeholder="جستجوی نام، کاربر یا موبایل…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-copper"
          onClick={() => setUserForm(emptyUser())}
        >
          افزودن کاربر
        </button>
      </div>

      <div className="sa-filter-chips" role="tablist" aria-label="فیلتر نقش">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            className={`sa-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {SITE_USER_FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="sub" style={{ marginBottom: 12 }}>
        {faNum(filtered.length)} نفر
      </div>

      {userForm && (
        <div className="panel">
          <h3>کاربر</h3>
          <div className="field">
            <label>نام نمایشی</label>
            <input
              value={userForm.displayName}
              onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
            />
          </div>
          <div className="grid-actions">
            <div className="field">
              <label>نام کاربری</label>
              <input
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              />
            </div>
            <div className="field">
              <label>رمز</label>
              <input
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>نقش</label>
            <select
              value={userForm.role}
              onChange={(e) => {
                const role = e.target.value as StaffRole
                setUserForm({
                  ...userForm,
                  role,
                  buildingId:
                    role === 'manager' || role === 'financeManager'
                      ? userForm.buildingId || platform.buildings[0]?.id
                      : undefined,
                  complexId:
                    role === 'complexManager'
                      ? userForm.complexId || platform.admin.complexes[0]?.id
                      : undefined,
                })
              }}
            >
              <option value="siteAdmin">{roleLabel.siteAdmin}</option>
              <option value="complexManager">{roleLabel.complexManager}</option>
              <option value="manager">مدیر بلوک / ساختمان / برج</option>
              <option value="financeManager">{roleLabel.financeManager}</option>
            </select>
          </div>
          {(userForm.role === 'manager' || userForm.role === 'financeManager') && (
            <div className="field">
              <label>ساختمان / بلوک / برج</label>
              <select
                value={userForm.buildingId ?? ''}
                onChange={(e) => setUserForm({ ...userForm, buildingId: e.target.value })}
              >
                {platform.buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({buildingTypeLabel[b.type]})
                  </option>
                ))}
              </select>
            </div>
          )}
          {userForm.role === 'complexManager' && (
            <div className="field">
              <label>شهرک</label>
              <select
                value={userForm.complexId ?? ''}
                onChange={(e) => setUserForm({ ...userForm, complexId: e.target.value })}
              >
                {platform.admin.complexes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setUserForm(null)}>
              انصراف
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!userForm.username.trim() || !userForm.password.trim()) return
                upsertUser({
                  ...userForm,
                  username: userForm.username.trim(),
                  displayName: userForm.displayName.trim() || userForm.username.trim(),
                })
                setUserForm(null)
                onFlash('کاربر ذخیره شد')
              }}
            >
              ذخیره
            </button>
          </div>
        </div>
      )}

      <div className="sa-contact-grid">
        {filtered.map((u) => {
          const scope = u.buildingId
            ? platform.buildings.find((b) => b.id === u.buildingId)
            : undefined
          const cpx = u.complexId
            ? platform.admin.complexes.find((c) => c.id === u.complexId)
            : undefined
          const initials = u.displayName.trim().slice(0, 1) || '؟'
          return (
            <article className="sa-contact-card" key={u.id}>
              <div className="sa-contact-card__avatar" aria-hidden>
                {initials}
              </div>
              <div className="sa-contact-card__body">
                <div className="sa-contact-card__name">{u.displayName}</div>
                <div className="sa-contact-card__role">{filterLabel(u, platform.buildings)}</div>
                <div className="sa-contact-card__meta">
                  {u.username}
                  {u.phone ? ` · ${u.phone}` : ''}
                  <br />
                  {scope
                    ? `${scope.name} (${buildingTypeLabel[scope.type]})`
                    : cpx
                      ? cpx.name
                      : 'کل پلتفرم'}
                </div>
              </div>
              <span className={`badge ${u.status === 'active' ? 'ok' : 'soon'}`}>
                {u.status === 'active' ? 'فعال' : 'غیرفعال'}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => setUserForm({ ...u })}
              >
                ویرایش
              </button>
            </article>
          )
        })}
      </div>
      {filtered.length === 0 && <div className="empty">کاربری با این فیلتر نیست.</div>}
    </>
  )
}
