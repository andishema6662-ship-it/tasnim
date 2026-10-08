import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { roleHint, roleLabel } from '../lib/rbac'
import { DEMO_OTP_CODE } from '../store/platformTypes'
import { useStore } from '../store/StoreContext'
import { DEMO_CREDENTIALS, buildingTypeLabel, type Role } from '../store/types'

type LoginMode = Role
type AuthTab = 'otp' | 'password'

export function Login() {
  const { platform, loginStaff, loginBuilding, requestSmsOtp, verifySmsOtp } = useStore()
  const navigate = useNavigate()
  const [authTab, setAuthTab] = useState<AuthTab>('otp')
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
  const [phone, setPhone] = useState(
    () => platform.admin.users.find((u) => u.role === 'manager')?.phone ?? '09120000003',
  )
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

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
    const user = platform.admin.users.find((u) => u.username === demo?.username)
    if (user?.phone) setPhone(user.phone)
  }

  const goAfterStaff = (role: Role) => {
    if (role === 'siteAdmin') navigate('/app/site-admin')
    else if (role === 'complexManager') navigate('/app/complex')
    else navigate('/app')
  }

  return (
    <div className="app-shell auth login-shell">
      <div className="login-layout">
        <section className="login-hero">
          <div className="brand-mark">
            <div className="logo" style={{ background: 'rgba(255,255,255,0.2)', boxShadow: 'none' }}>
              د
            </div>
            <div>
              <div className="name">دیارشارژ</div>
              <span className="tag">مدیریت شارژ ساختمان و شهرک</span>
            </div>
          </div>
          <h1>ورود امن و سریع به پنل</h1>
          <p>
            با پیامک یک‌بارمصرف یا نام کاربری وارد شوید. روی دسکتاپ تمام‌صفحه؛ روی موبایل جمع‌وجور و
            خوانا.
          </p>
          <div className="chip-row" style={{ marginTop: 22 }}>
            <span className="chip active" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              OTP پیامکی
            </span>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
              رمز عبور
            </span>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
              چهار نقش
            </span>
          </div>
        </section>

        <section className="login-card">
          <div className="chip-row admin-nav">
            <button
              type="button"
              className={`chip ${authTab === 'otp' ? 'active' : ''}`}
              onClick={() => {
                setAuthTab('otp')
                setError(null)
              }}
            >
              ورود با پیامک
            </button>
            <button
              type="button"
              className={`chip ${authTab === 'password' ? 'active' : ''}`}
              onClick={() => {
                setAuthTab('password')
                setError(null)
              }}
            >
              نام کاربری / رمز
            </button>
          </div>

          {authTab === 'otp' ? (
            <>
              <h2 style={{ marginTop: 4 }}>کد یک‌بارمصرف</h2>
              <p className="lead">شماره موبایل ثبت‌شده را وارد کنید؛ کد از وب‌سرویس پیامک (stub) ارسال می‌شود.</p>
              <div className="field">
                <label>شماره موبایل</label>
                <input
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912…"
                  autoComplete="tel"
                />
              </div>
              {!otpSent ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    const res = requestSmsOtp(phone)
                    if (!res.ok) {
                      setError(res.message)
                      setInfo(null)
                      return
                    }
                    setError(null)
                    setOtpSent(true)
                    setDemoCode(res.demoCode ?? DEMO_OTP_CODE)
                    setInfo(res.message)
                    setOtp(res.demoCode ?? '')
                  }}
                >
                  ارسال کد
                </button>
              ) : (
                <>
                  <div className="field">
                    <label>کد ۵ رقمی</label>
                    <input
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder={DEMO_OTP_CODE}
                      className="otp-boxes"
                      style={{ letterSpacing: '0.35em', textAlign: 'center', fontWeight: 700 }}
                    />
                  </div>
                  {demoCode && (
                    <div className="demo-otp-hint">
                      دمو OTP: <strong>{demoCode}</strong> — در حالت stub همیشه همین کد پذیرفته می‌شود.
                    </div>
                  )}
                  <div className="grid-actions" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setOtpSent(false)
                        setOtp('')
                        setDemoCode(null)
                      }}
                    >
                      تغییر شماره
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        const ok = verifySmsOtp(phone, otp)
                        if (!ok) {
                          setError('کد نادرست یا منقضی است.')
                          return
                        }
                        const user = platform.admin.users.find(
                          (u) =>
                            u.phone &&
                            u.phone.replace(/\D/g, '') === phone.replace(/\D/g, '').replace(/^98/, '0'),
                        )
                        goAfterStaff(user?.role ?? 'manager')
                      }}
                    >
                      تأیید و ورود
                    </button>
                  </div>
                </>
              )}
              <div className="sub" style={{ marginTop: 14 }}>
                شماره‌های دمو: ادمین ۰۹۱۲۰۰۰۰۰۰۱ · شهرک ۰۹۱۲۰۰۰۰۰۰۲ · بلوک ۰۹۱۲۰۰۰۰۰۰۳ · مالی
                ۰۹۱۲۰۰۰۰۰۰۴
              </div>
            </>
          ) : (
            <>
              <h2 style={{ marginTop: 4 }}>ورود نقش‌محور</h2>
              <p className="lead">چهار نقش سازمانی + ورود ساکن.</p>
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

              <div className="panel" style={{ marginTop: 16, marginBottom: 0 }}>
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
            </>
          )}

          {error && (
            <div className="badge danger" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}
          {info && !error && (
            <div className="badge ok" style={{ marginTop: 12 }}>
              {info}
            </div>
          )}

          <Link className="btn btn-ghost" to="/" style={{ marginTop: 16, display: 'inline-flex' }}>
            بازگشت
          </Link>
        </section>
      </div>
    </div>
  )
}
