import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import type { Role } from '../store/types'

export function Login() {
  const { state, login } = useStore()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('manager')
  const [unitId, setUnitId] = useState(state.units[0]?.id ?? '')

  return (
    <div className="app-shell auth">
      <div className="page" style={{ paddingTop: 28 }}>
        <div className="brand-mark" style={{ marginBottom: 18 }}>
          <div className="logo">د</div>
          <div>
            <div className="name">دیارشارژ</div>
            <span className="tag">انتخاب نقش — دمو محلی</span>
          </div>
        </div>
        <h2>ورود</h2>
        <p className="lead">برای آزمایش MVP نقش خود را انتخاب کنید. داده در همین مرورگر ذخیره می‌شود.</p>

        <div className="panel">
          <div className="field">
            <label>نقش</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="manager">مدیر ساختمان</option>
              <option value="resident">ساکن / واحد</option>
            </select>
          </div>
          {role === 'resident' && (
            <div className="field">
              <label>واحد</label>
              <select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                {state.units.map((u) => (
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
              login(role, role === 'resident' ? unitId : undefined)
              navigate('/app')
            }}
          >
            ادامه
          </button>
        </div>
        <Link className="btn btn-ghost" to="/">
          بازگشت
        </Link>
      </div>
    </div>
  )
}
