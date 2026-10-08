import { Link, useLocation } from 'react-router-dom'
import { roleAllowsPath, roleLabel } from '../lib/rbac'
import { useStore } from '../store/StoreContext'

export function RoleDenied({ role }: { role: string }) {
  return (
    <div className="page">
      <h2>دسترسی محدود</h2>
      <p className="lead">نقش «{role}» به این بخش دسترسی ندارد.</p>
      <Link className="btn btn-primary" to="/app">
        بازگشت به خانه
      </Link>
    </div>
  )
}

/** Building-scoped route guard by RBAC role (feature toggles applied separately). */
export function RoleGate({ children }: { children: React.ReactNode }) {
  const { session } = useStore()
  const location = useLocation()
  if (!session) return null
  if (session.role === 'siteAdmin' || session.role === 'complexManager') {
    return <>{children}</>
  }
  if (!roleAllowsPath(session.role, location.pathname)) {
    return <RoleDenied role={roleLabel[session.role]} />
  }
  return <>{children}</>
}
