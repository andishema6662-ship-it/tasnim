import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'

const managerNav = [
  { to: '/app', end: true, label: 'خانه', ico: '⌂' },
  { to: '/app/units', label: 'واحدها', ico: '▦' },
  { to: '/app/charges', label: 'شارژ', ico: '◎' },
  { to: '/app/finance', label: 'مالی', ico: '﷼' },
  { to: '/app/more', label: 'بیشتر', ico: '⋯' },
]

const residentNav = [
  { to: '/app', end: true, label: 'خانه', ico: '⌂' },
  { to: '/app/bills', label: 'قبوض', ico: '◎' },
  { to: '/app/meetings', label: 'جلسات', ico: '☰' },
  { to: '/app/polls', label: 'نظرسنجی', ico: '✓' },
  { to: '/app/more', label: 'بیشتر', ico: '⋯' },
]

export function Shell() {
  const { state, session, logout, returnToSiteAdmin } = useStore()
  const navigate = useNavigate()

  if (!session) return <Navigate to="/login" replace />
  if (session.role === 'siteAdmin' && !session.viaSiteAdmin) {
    return <Navigate to="/app/site-admin" replace />
  }
  if (!state) return <Navigate to="/login" replace />

  const nav = state.session.role === 'manager' ? managerNav : residentNav
  const unread = state.notifications.filter((n) => !n.read).length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <div className="logo">د</div>
          <div>
            <div className="name">دیارشارژ</div>
            <span className="tag">{state.buildingName}</span>
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div className="meta">{state.session.displayName}</div>
          {session.viaSiteAdmin && (
            <button
              className="btn-ghost"
              type="button"
              onClick={() => {
                returnToSiteAdmin()
                navigate('/app/site-admin')
              }}
            >
              پنل سایت
            </button>
          )}
          <button
            className="btn-ghost"
            type="button"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            خروج
          </button>
          {unread > 0 && (
            <NavLink to="/app/notifications" className="badge warn" style={{ marginInlineStart: 6 }}>
              {unread} اعلان
            </NavLink>
          )}
        </div>
      </header>
      <Outlet />
      <nav className="bottom-nav" aria-label="ناوبری اصلی">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="ico">{item.ico}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
