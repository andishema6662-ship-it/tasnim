import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { faNum, toman } from '../lib/format'
import { useStore } from '../store/StoreContext'
import {
  buildingStatusLabel,
  buildingTypeLabel,
  type BuildingMeta,
  type BuildingStatus,
  type BuildingType,
} from '../store/types'

/** Demo subscription quote: monthly per unit × months (same spirit as Subscription page) */
function subscriptionTotal(units: number, months: number) {
  const rate = units <= 10 ? 45_000 : units <= 30 ? 38_000 : units <= 80 ? 32_000 : 28_000
  const discount = months >= 12 ? 0.18 : months >= 6 ? 0.1 : months >= 3 ? 0.05 : 0
  return Math.round(units * rate * months * (1 - discount))
}

function emptyMeta(): BuildingMeta {
  return {
    id: `bld-${Date.now()}`,
    name: '',
    address: '',
    unitCount: 0,
    type: 'building',
    status: 'active',
    managerName: '',
    managerPhone: '',
    subscriptionUnits: 10,
    subscriptionMonths: 12,
  }
}

export function SiteAdmin() {
  const { platform, session, upsertBuilding, enterBuildingAsManager, logout, resetDemo } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState<BuildingMeta | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const stats = useMemo(() => {
    return platform.buildings.map((meta) => {
      const data = platform.byId[meta.id]
      const units = data?.units.length ?? 0
      const debt = (data?.units ?? []).reduce((s, u) => s + Math.min(0, u.balance), 0)
      const fund = data?.fundBalance ?? 0
      const sub = subscriptionTotal(meta.subscriptionUnits, meta.subscriptionMonths)
      return { meta, units, debt: Math.abs(debt), fund, sub }
    })
  }, [platform])

  if (!session || session.role !== 'siteAdmin') {
    return (
      <div className="app-shell auth">
        <div className="page" style={{ paddingTop: 40 }}>
          <h2>دسترسی محدود</h2>
          <p className="lead">این پنل فقط برای مدیر سایت است.</p>
          <Link className="btn btn-primary" to="/login">
            ورود
          </Link>
        </div>
      </div>
    )
  }

  const save = () => {
    if (!form || !form.name.trim()) return
    upsertBuilding({
      ...form,
      name: form.name.trim(),
      address: form.address.trim(),
      managerName: form.managerName.trim() || 'مدیر تعیین‌نشده',
    })
    setForm(null)
    setToast('ساختمان ذخیره شد')
    setTimeout(() => setToast(null), 2200)
  }

  return (
    <div className="app-shell auth">
      <div className="page" style={{ paddingTop: 18 }}>
        <header className="topbar">
          <div className="brand-mark">
            <div className="logo">د</div>
            <div>
              <div className="name">دیارشارژ</div>
              <span className="tag">پنل مدیریت سایت</span>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div className="meta">{session.displayName}</div>
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
          </div>
        </header>

        <h2>مدیریت ساختمان‌ها</h2>
        <p className="lead">چند بلوک، ساختمان یا برج روی یک پلتفرم — هر کدام دادهٔ جدا دارند.</p>

        <div className="stat-row">
          <div className="stat">
            <span className="label">تعداد املاک</span>
            <span className="value">{faNum(platform.buildings.length)}</span>
          </div>
          <div className="stat">
            <span className="label">فعال</span>
            <span className="value">
              {faNum(platform.buildings.filter((b) => b.status === 'active').length)}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-copper"
          style={{ width: '100%', marginBottom: 14 }}
          onClick={() => setForm(emptyMeta())}
        >
          افزودن ساختمان / بلوک / برج
        </button>

        {form && (
          <div className="panel">
            <h3>{platform.buildings.some((b) => b.id === form.id) ? 'ویرایش' : 'ثبت جدید'}</h3>
            <div className="field">
              <label>نام</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>آدرس</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid-actions">
              <div className="field">
                <label>نوع</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as BuildingType })}
                >
                  <option value="block">بلوک</option>
                  <option value="building">ساختمان</option>
                  <option value="tower">برج</option>
                </select>
              </div>
              <div className="field">
                <label>وضعیت</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as BuildingStatus })}
                >
                  <option value="active">فعال</option>
                  <option value="disabled">غیرفعال</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>تعداد واحد (ثبتی / اشتراک)</label>
              <input
                type="number"
                min={0}
                value={form.unitCount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    unitCount: Number(e.target.value),
                    subscriptionUnits: Number(e.target.value) || form.subscriptionUnits,
                  })
                }
              />
            </div>
            <div className="field">
              <label>مدیر ساختمان</label>
              <input
                value={form.managerName}
                onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                placeholder="نام مدیر"
              />
            </div>
            <div className="field">
              <label>تلفن مدیر</label>
              <input
                value={form.managerPhone ?? ''}
                onChange={(e) => setForm({ ...form, managerPhone: e.target.value })}
              />
            </div>
            <div className="grid-actions">
              <div className="field">
                <label>واحد اشتراک</label>
                <input
                  type="number"
                  min={1}
                  value={form.subscriptionUnits}
                  onChange={(e) => setForm({ ...form, subscriptionUnits: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>دوره (ماه)</label>
                <select
                  value={form.subscriptionMonths}
                  onChange={(e) => setForm({ ...form, subscriptionMonths: Number(e.target.value) })}
                >
                  <option value={1}>۱</option>
                  <option value={3}>۳</option>
                  <option value={6}>۶</option>
                  <option value={12}>۱۲</option>
                </select>
              </div>
            </div>
            <div className="grid-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>
                انصراف
              </button>
              <button type="button" className="btn btn-primary" onClick={save}>
                ذخیره
              </button>
            </div>
          </div>
        )}

        <div className="list">
          {stats.map(({ meta, units, debt, fund, sub }) => (
            <div className="panel" key={meta.id}>
              <div className="list-item" style={{ paddingTop: 0 }}>
                <div>
                  <div className="title">{meta.name}</div>
                  <div className="sub">
                    {buildingTypeLabel[meta.type]} · {meta.address}
                    <br />
                    مدیر: {meta.managerName}
                    {meta.managerPhone ? ` · ${meta.managerPhone}` : ''}
                    <br />
                    واحدها: {faNum(units)} (ثبتی {faNum(meta.unitCount)}) · بدهی {toman(debt)}
                    <br />
                    صندوق {toman(fund)} · اشتراک تقریبی {toman(sub)}
                  </div>
                </div>
                <span className={`badge ${meta.status === 'active' ? 'ok' : 'soon'}`}>
                  {buildingStatusLabel[meta.status]}
                </span>
              </div>
              <div className="grid-actions" style={{ marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...meta })}>
                  ویرایش
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={meta.status === 'disabled'}
                  onClick={() => {
                    enterBuildingAsManager(meta.id)
                    navigate('/app')
                  }}
                >
                  ورود به ساختمان
                </button>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginTop: 4 }}
                onClick={() =>
                  upsertBuilding({
                    ...meta,
                    status: meta.status === 'active' ? 'disabled' : 'active',
                  })
                }
              >
                {meta.status === 'active' ? 'غیرفعال‌سازی' : 'فعال‌سازی مجدد'}
              </button>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>دمو</h3>
          <p className="sub" style={{ margin: '0 0 10px' }}>
            داده در localStorage با کلید جدا برای هر ساختمان نگهداری می‌شود.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => {
              if (confirm('بازنشانی همه ساختمان‌های دمو؟')) resetDemo()
            }}
          >
            بازنشانی دمو پلتفرم
          </button>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
