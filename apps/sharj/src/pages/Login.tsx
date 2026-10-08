import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { SITE_ADMIN_DEMO, buildingTypeLabel, type Role } from '../store/types'

type LoginMode = 'building' | 'siteAdmin'

export function Login() {
  const { platform, loginBuilding, loginSiteAdmin } = useStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState<LoginMode>('building')
  const [role, setRole] = useState<Exclude<Role, 'siteAdmin'>>('manager')
  const activeBuildings = useMemo(
    () => platform.buildings.filter((b) => b.status === 'active'),
    [platform.buildings],
  )
  const [buildingId, setBuildingId] = useState(activeBuildings[0]?.id ?? '')
  const units = platform.byId[buildingId]?.units ?? []
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const [username, setUsername] = useState<string>(SITE_ADMIN_DEMO.username)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onBuildingChange = (id: string) => {
    setBuildingId(id)
    const first = platform.byId[id]?.units[0]?.id ?? ''
    setUnitId(first)
  }

  return (
    <div className="app-shell auth">
      <div className="page" style={{ paddingTop: 28 }}>
        <div className="brand-mark" style={{ marginBottom: 18 }}>
          <div className="logo">د</div>
          <div>
            <div className="name">دیارشارژ</div>
            <span className="tag">ورود چندساختمانی — دمو محلی</span>
          </div>
        </div>
        <h2>ورود</h2>
        <p className="lead">مدیر سایت همه ساختمان‌ها را مدیریت می‌کند؛ مدیر و ساکن فقط ساختمان خود را می‌بینند.</p>

        <div className="panel">
          <div className="field">
            <label>نوع ورود</label>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as LoginMode)
                setError(null)
              }}
            >
              <option value="building">مدیر / ساکن ساختمان</option>
              <option value="siteAdmin">مدیر سایت (سوپرادمین)</option>
            </select>
          </div>

          {mode === 'siteAdmin' ? (
            <>
              <div className="field">
                <label>نام کاربری</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
              </div>
              <div className="field">
                <label>رمز عبور</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="admin123"
                />
              </div>
              <div className="sub" style={{ marginBottom: 12 }}>
                دمو: کاربر <strong>{SITE_ADMIN_DEMO.username}</strong> / رمز{' '}
                <strong>{SITE_ADMIN_DEMO.password}</strong>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  const ok = loginSiteAdmin(username, password)
                  if (!ok) {
                    setError('نام کاربری یا رمز نادرست است.')
                    return
                  }
                  navigate('/app/site-admin')
                }}
              >
                ورود به پنل سایت
              </button>
            </>
          ) : (
            <>
              <div className="field">
                <label>ساختمان / بلوک / برج</label>
                <select value={buildingId} onChange={(e) => onBuildingChange(e.target.value)}>
                  {activeBuildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({buildingTypeLabel[b.type]})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>نقش</label>
                <select value={role} onChange={(e) => setRole(e.target.value as 'manager' | 'resident')}>
                  <option value="manager">مدیر ساختمان</option>
                  <option value="resident">ساکن / واحد</option>
                </select>
              </div>
              {role === 'resident' && (
                <div className="field">
                  <label>واحد</label>
                  <select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        واحد {u.number} — {u.residentName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  const ok = loginBuilding(role, buildingId, role === 'resident' ? unitId : undefined)
                  if (!ok) {
                    setError('ورود ممکن نشد. ساختمان فعال و واحد معتبر انتخاب کنید.')
                    return
                  }
                  navigate('/app')
                }}
              >
                ورود به اپ ساختمان
              </button>
            </>
          )}
          {error && (
            <div className="badge danger" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}
        </div>
        <Link className="btn btn-ghost" to="/">
          بازگشت
        </Link>
      </div>
    </div>
  )
}
