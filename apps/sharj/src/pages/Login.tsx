import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { roleHint, roleLabel } from '../lib/rbac'
import { useStore } from '../store/StoreContext'
import { DEMO_CREDENTIALS, buildingTypeLabel, type Role } from '../store/types'

type LoginMode = Role

export function Login() {
  const { platform, loginStaff, loginBuilding } = useStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState<LoginMode>('manager')
  const activeBuildings = useMemo(
    () => platform.buildings.filter((b) => b.status === 'active'),
    [platform.buildings],
  )
  const [buildingId, setBuildingId] = useState(activeBuildings[0]?.id ?? '')
  const units = platform.byId[buildingId]?.units ?? []
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const demoForMode = DEMO_CREDENTIALS.find((d) => d.role === mode)
  const [username, setUsername] = useState(demoForMode?.username ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onBuildingChange = (id: string) => {
    setBuildingId(id)
    setUnitId(platform.byId[id]?.units[0]?.id ?? '')
  }

  const onModeChange = (next: LoginMode) => {
    setMode(next)
    setError(null)
    setPassword('')
    const demo = DEMO_CREDENTIALS.find((d) => d.role === next)
    setUsername(demo?.username ?? '')
  }

  const goAfterStaff = (role: Role) => {
    if (role === 'siteAdmin') navigate('/app/site-admin')
    else if (role === 'complexManager') navigate('/app/complex')
    else navigate('/app')
  }

  return (
    <div className="app-shell auth">
      <div className="page" style={{ paddingTop: 28 }}>
        <div className="brand-mark" style={{ marginBottom: 18 }}>
          <div className="logo">د</div>
          <div>
            <div className="name">دیارشارژ</div>
            <span className="tag">ورود نقش‌محور — دمو محلی</span>
          </div>
        </div>
        <h2>ورود</h2>
        <p className="lead">چهار نقش سازمانی + ورود ساکن. هر نقش منو و مسیر خودش را دارد.</p>

        <div className="panel">
          <div className="field">
            <label>نقش</label>
            <select value={mode} onChange={(e) => onModeChange(e.target.value as LoginMode)}>
              <option value="siteAdmin">{roleLabel.siteAdmin}</option>
              <option value="complexManager">{roleLabel.complexManager}</option>
              <option value="manager">{roleLabel.manager}</option>
              <option value="financeManager">{roleLabel.financeManager}</option>
              <option value="resident">{roleLabel.resident}</option>
            </select>
            <div className="sub" style={{ marginTop: 6 }}>
              {roleHint[mode]}
            </div>
          </div>

          {mode === 'resident' ? (
            <>
              <div className="field">
                <label>ساختمان / بلوک</label>
                <select value={buildingId} onChange={(e) => onBuildingChange(e.target.value)}>
                  {activeBuildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({buildingTypeLabel[b.type]})
                    </option>
                  ))}
                </select>
              </div>
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
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  const ok = loginBuilding('resident', buildingId, unitId)
                  if (!ok) {
                    setError('ورود ساکن ممکن نشد.')
                    return
                  }
                  navigate('/app')
                }}
              >
                ورود ساکن
              </button>
            </>
          ) : (
            <>
              <div className="field">
                <label>نام کاربری</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="field">
                <label>رمز عبور</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder={demoForMode?.password}
                />
              </div>
              {demoForMode && (
                <div className="sub" style={{ marginBottom: 12 }}>
                  دمو: <strong>{demoForMode.username}</strong> /{' '}
                  <strong>{demoForMode.password}</strong>
                  {'scope' in demoForMode && demoForMode.scope
                    ? ` — ${demoForMode.scope}`
                    : ''}
                </div>
              )}
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  const user = platform.admin.users.find(
                    (u) =>
                      u.username === username.trim() &&
                      u.password === password &&
                      u.status === 'active',
                  )
                  const resolved =
                    user?.role ??
                    (username.trim() === 'admin' && password === 'admin123'
                      ? 'siteAdmin'
                      : username.trim() === 'complex' && password === 'complex123'
                        ? 'complexManager'
                        : undefined)
                  if (!resolved) {
                    setError('نام کاربری یا رمز نادرست است.')
                    return
                  }
                  if (resolved !== mode) {
                    setError(
                      `این حساب نقش «${roleLabel[resolved]}» دارد. نقش را به همان تغییر دهید.`,
                    )
                    return
                  }
                  const ok = loginStaff(username, password)
                  if (!ok) {
                    setError('ورود ممکن نشد — ساختمان/شهرک غیرفعال است.')
                    return
                  }
                  goAfterStaff(mode)
                }}
              >
                ورود به‌عنوان {roleLabel[mode]}
              </button>
            </>
          )}
          {error && (
            <div className="badge danger" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}
        </div>

        <div className="panel">
          <h3>ماتریس دمو</h3>
          <div className="list">
            {DEMO_CREDENTIALS.map((d) => (
              <button
                type="button"
                key={d.username}
                className="list-item"
                style={{ width: '100%', textAlign: 'start', cursor: 'pointer' }}
                onClick={() => {
                  onModeChange(d.role)
                  setUsername(d.username)
                  setPassword(d.password)
                }}
              >
                <div>
                  <div className="title">{d.label}</div>
                  <div className="sub">
                    {d.username} / {d.password}
                    {'scope' in d && d.scope ? ` · ${d.scope}` : ''}
                  </div>
                </div>
                <span className="badge">انتخاب</span>
              </button>
            ))}
          </div>
        </div>

        <Link className="btn btn-ghost" to="/">
          بازگشت
        </Link>
      </div>
    </div>
  )
}
