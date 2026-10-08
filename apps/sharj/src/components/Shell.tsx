import { useRef, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BackButton } from './BackButton'
import { OnboardingBanner } from './OnboardingBanner'
import { effectiveFeatureSet } from '../lib/features'
import { roleLabel } from '../lib/rbac'
import { useStore } from '../store/StoreContext'
import type { FeatureModuleId } from '../store/platformTypes'

type NavIcon = 'home' | 'units' | 'charges' | 'finance' | 'settings' | 'bills' | 'meetings' | 'polls'

type NavItem = {
  to: string
  end?: boolean
  label: string
  icon: NavIcon
  feature?: FeatureModuleId
}

function NavSvg({ name }: { name: NavIcon }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      )
    case 'units':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'charges':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v10M9.5 9.5c.8-1 2.2-1.4 3.5-.9s2 1.8 1.5 3.1c-.4 1.1-1.5 1.8-2.7 1.8H11" />
        </svg>
      )
    case 'finance':
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h16" />
          <path d="M7 15v-3.5a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1V15" />
          <path d="M14 15V8.5a1 1 0 0 1 1-1H18a1 1 0 0 1 1 1V15" />
        </svg>
      )
    case 'bills':
      return (
        <svg {...common}>
          <path d="M7 3.5h10a1 1 0 0 1 1 1V20l-2.2-1.4L13.5 20 11 18.6 8.5 20 6 18.6V4.5a1 1 0 0 1 1-1Z" />
          <path d="M9 8h6M9 11.5h6M9 15h3.5" />
        </svg>
      )
    case 'meetings':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
        </svg>
      )
    case 'polls':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.2 10.8 15l5.2-6" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6" />
        </svg>
      )
  }
}

const managerNav: NavItem[] = [
  { to: '/app', end: true, label: 'خانه', icon: 'home' },
  { to: '/app/units', label: 'واحدها', icon: 'units' },
  { to: '/app/charges', label: 'شارژ', icon: 'charges', feature: 'charges' },
  { to: '/app/finance', label: 'مالی', icon: 'finance', feature: 'finance' },
  { to: '/app/more', label: 'تنظیمات', icon: 'settings' },
]

const financeNav: NavItem[] = [
  { to: '/app', end: true, label: 'خانه', icon: 'home' },
  { to: '/app/charges', label: 'شارژ', icon: 'charges', feature: 'charges' },
  { to: '/app/bills', label: 'قبوض', icon: 'bills' },
  { to: '/app/finance', label: 'مالی', icon: 'finance', feature: 'finance' },
  { to: '/app/more', label: 'تنظیمات', icon: 'settings' },
]

const residentNav: NavItem[] = [
  { to: '/app', end: true, label: 'خانه', icon: 'home' },
  { to: '/app/bills', label: 'قبوض', icon: 'bills' },
  { to: '/app/meetings', label: 'جلسات', icon: 'meetings', feature: 'meetings' },
  { to: '/app/polls', label: 'نظرسنجی', icon: 'polls', feature: 'polls' },
  { to: '/app/more', label: 'تنظیمات', icon: 'settings' },
]

const NESTED = /^\/app\/(?!$|more$)/

export function Shell() {
  const { platform, state, session, logout, returnToSiteAdmin, reloadFromStorage } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const pullStart = useRef<number | null>(null)
  const [pulling, setPulling] = useState(false)

  if (!session) return <Navigate to="/login" replace />
  if (session.role === 'siteAdmin' && !session.viaSiteAdmin) {
    return <Navigate to="/app/site-admin" replace />
  }
  if (session.role === 'complexManager') {
    return <Navigate to="/app/complex" replace />
  }
  if (!state) return <Navigate to="/login" replace />

  const meta = platform.buildings.find((b) => b.id === state.buildingId)
  const features = effectiveFeatureSet(
    meta,
    platform.admin.featureCatalog,
    platform.admin.subscriptionPayments,
  )

  const baseNav =
    state.session.role === 'financeManager'
      ? financeNav
      : state.session.role === 'manager'
        ? managerNav
        : residentNav

  const nav = baseNav.filter((item) => !item.feature || features.has(item.feature))
  const unread = state.notifications.filter((n) => !n.read).length
  const showBack = NESTED.test(location.pathname)

  return (
    <div className="app-shell wide">
      <header className="topbar">
        <div className="brand-mark">
          {showBack ? (
            <BackButton fallback="/app" label="بازگشت" className="back-ico-btn" />
          ) : (
            <div className="logo">د</div>
          )}
          <div>
            <div className="name">شارژبان</div>
            <span className="tag">{state.buildingName}</span>
          </div>
        </div>
        <div
          style={{
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2,
          }}
        >
          <div className="meta">{state.session.displayName}</div>
          <div className="meta" style={{ opacity: 0.85 }}>
            {roleLabel[state.session.role]}
          </div>
          <div className="topbar-actions">
            <button
              className="btn-ghost refresh-btn"
              type="button"
              title="بروزرسانی داده"
              aria-label="بروزرسانی داده"
              onClick={() => reloadFromStorage()}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M21 12a9 9 0 1 1-2.6-6.3" strokeLinecap="round" />
                <path d="M21 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
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
              <NavLink to="/app/notifications" className="badge warn">
                {unread} اعلان
              </NavLink>
            )}
          </div>
        </div>
      </header>
      <div
        className={`shell-scroll ${pulling ? 'pulling' : ''}`}
        onTouchStart={(e) => {
          if (window.scrollY <= 0) pullStart.current = e.touches[0].clientY
          else pullStart.current = null
        }}
        onTouchMove={(e) => {
          if (pullStart.current == null) return
          const dy = e.touches[0].clientY - pullStart.current
          setPulling(dy > 48)
        }}
        onTouchEnd={() => {
          if (pulling) reloadFromStorage()
          pullStart.current = null
          setPulling(false)
        }}
      >
        {pulling && <div className="pull-hint">رها کنید برای بروزرسانی…</div>}
        <OnboardingBanner />
        <Outlet />
      </div>
      <nav className="bottom-nav" aria-label="ناوبری اصلی">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="ico">
              <NavSvg name={item.icon} />
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
