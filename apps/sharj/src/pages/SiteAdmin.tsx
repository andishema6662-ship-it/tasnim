import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { faDate, faNum, toman } from '../lib/format'
import { roleLabel } from '../lib/rbac'
import {
  FEATURE_CATALOG,
  type FeatureModuleId,
  type PlatformUser,
  type SiteAdminSection,
  type StaffRole,
} from '../store/platformTypes'
import { ALL_FEATURES } from '../store/seedAdmin'
import { useStore } from '../store/StoreContext'
import {
  buildingStatusLabel,
  buildingTypeLabel,
  type BuildingMeta,
  type BuildingStatus,
  type BuildingType,
} from '../store/types'
import { qarzStatusLabel } from '../lib/qarz'

const SECTIONS: { id: SiteAdminSection; label: string }[] = [
  { id: 'properties', label: 'املاک' },
  { id: 'users', label: 'کاربران' },
  { id: 'subscriptions', label: 'اشتراک' },
  { id: 'tariffs', label: 'تعرفه' },
  { id: 'discounts', label: 'تخفیف' },
  { id: 'storage', label: 'فضا' },
  { id: 'features', label: 'امکانات' },
  { id: 'finance', label: 'مالی' },
  { id: 'activity', label: 'فعالیت' },
  { id: 'sms', label: 'پیامک' },
  { id: 'gateway', label: 'درگاه' },
  { id: 'qarz', label: 'صندوق' },
  { id: 'complex', label: 'شهرک/تیکت' },
]

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
    storageQuotaMb: 500,
    enabledFeatures: [...ALL_FEATURES],
  }
}

function BarChart({
  items,
}: {
  items: { label: string; value: number; color?: string }[]
}) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="bar-chart" aria-label="نمودار">
      {items.map((item) => (
        <div className="bar-row" key={item.label}>
          <span className="bar-label">{item.label}</span>
          <div className="bar-track">
            <i
              style={{
                width: `${Math.round((item.value / max) * 100)}%`,
                background: item.color ?? 'var(--teal)',
              }}
            />
          </div>
          <span className="bar-val">{faNum(item.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function SiteAdmin() {
  const {
    platform,
    session,
    upsertBuilding,
    enterBuildingAsManager,
    logout,
    resetDemo,
    upsertDiscount,
    upsertTariff,
    updateSmsConfig,
    testSmsStub,
    updateGatewayConfig,
    reviewSubscriptionPayment,
    setBuildingStorageQuota,
    setBuildingFeatures,
    updateComplexTicket,
    upsertUser,
    upsertComplex,
  } = useStore()
  const navigate = useNavigate()
  const [section, setSection] = useState<SiteAdminSection>('properties')
  const [form, setForm] = useState<BuildingMeta | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [discountForm, setDiscountForm] = useState({
    code: '',
    percent: 10,
    maxUses: 50,
  })
  const [featBuildingId, setFeatBuildingId] = useState(platform.buildings[0]?.id ?? '')
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

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2400)
  }

  const propertyStats = useMemo(() => {
    return platform.buildings.map((meta) => {
      const data = platform.byId[meta.id]
      const units = data?.units.length ?? 0
      const debt = (data?.units ?? []).reduce((s, u) => s + Math.min(0, u.balance), 0)
      const fund = data?.fundBalance ?? 0
      return { meta, units, debt: Math.abs(debt), fund }
    })
  }, [platform])

  const activityByKind = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of platform.admin.activity) {
      map.set(a.kind, (map.get(a.kind) ?? 0) + 1)
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }))
  }, [platform.admin.activity])

  const financeBars = useMemo(() => {
    return platform.buildings.map((b) => ({
      label: b.name.slice(0, 10),
      value: Math.round((platform.byId[b.id]?.fundBalance ?? 0) / 1_000_000),
      color: 'var(--copper)',
    }))
  }, [platform])

  const allQarz = useMemo(() => {
    return platform.buildings.flatMap((b) =>
      (platform.byId[b.id]?.qarzFunds ?? []).map((q) => ({ ...q, buildingName: b.name, buildingId: b.id })),
    )
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

  const saveBuilding = () => {
    if (!form || !form.name.trim()) return
    upsertBuilding({
      ...form,
      name: form.name.trim(),
      address: form.address.trim(),
      managerName: form.managerName.trim() || 'مدیر تعیین‌نشده',
    })
    setForm(null)
    flash('ساختمان ذخیره شد')
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

        <h2>مرکز مدیریت پلتفرم</h2>
        <p className="lead">سایت → شهرک → بلوک/برج — اشتراک، امکانات، مالی و تیکت فنی.</p>

        <div className="chip-row admin-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip ${section === s.id ? 'active' : ''}`}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {section === 'properties' && (
          <>
            <div className="stat-row">
              <div className="stat">
                <span className="label">املاک</span>
                <span className="value">{faNum(platform.buildings.length)}</span>
              </div>
              <div className="stat">
                <span className="label">شهرک‌ها</span>
                <span className="value">{faNum(platform.admin.complexes.length)}</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-copper"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={() => setForm(emptyMeta())}
            >
              افزودن ساختمان / بلوک / برج
            </button>
            {form && (
              <div className="panel">
                <h3>ثبت / ویرایش</h3>
                <div className="field">
                  <label>نام</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>آدرس</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
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
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value as BuildingStatus })
                      }
                    >
                      <option value="active">فعال</option>
                      <option value="disabled">غیرفعال</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>مدیر ساختمان</label>
                  <input
                    value={form.managerName}
                    onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>شهرک (اختیاری)</label>
                  <select
                    value={form.complexId ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, complexId: e.target.value || undefined })
                    }
                  >
                    <option value="">— بدون شهرک —</option>
                    {platform.admin.complexes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>
                    انصراف
                  </button>
                  <button type="button" className="btn btn-primary" onClick={saveBuilding}>
                    ذخیره
                  </button>
                </div>
              </div>
            )}
            {propertyStats.map(({ meta, units, debt, fund }) => (
              <div className="panel" key={meta.id}>
                <div className="list-item" style={{ paddingTop: 0 }}>
                  <div>
                    <div className="title">{meta.name}</div>
                    <div className="sub">
                      {buildingTypeLabel[meta.type]} · {meta.address}
                      <br />
                      مدیر: {meta.managerName} · واحد {faNum(units)} · بدهی {toman(debt)}
                      <br />
                      صندوق {toman(fund)} · سهمیه فضا {faNum(meta.storageQuotaMb)} مگابایت
                    </div>
                  </div>
                  <span className={`badge ${meta.status === 'active' ? 'ok' : 'soon'}`}>
                    {buildingStatusLabel[meta.status]}
                  </span>
                </div>
                <div className="grid-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...meta })}>
                    ویرایش
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      enterBuildingAsManager(meta.id)
                      navigate('/app')
                    }}
                  >
                    ورود به ساختمان
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {section === 'subscriptions' && (
          <div className="panel">
            <h3>واریز / فیش اشتراک</h3>
            <div className="list">
              {platform.admin.subscriptionPayments.map((sp) => {
                const b = platform.buildings.find((x) => x.id === sp.buildingId)
                return (
                  <div className="list-item" key={sp.id}>
                    <div>
                      <div className="title">
                        {b?.name ?? sp.buildingId} — {toman(sp.amount)}
                      </div>
                      <div className="sub">
                        {faNum(sp.units)} واحد · {faNum(sp.months)} ماه ·{' '}
                        {sp.method === 'gateway' ? 'درگاه' : 'فیش بانکی'}
                        {sp.discountCode ? ` · کد ${sp.discountCode}` : ''}
                        <br />
                        {sp.trackingCode} · {faDate(sp.createdAt)}
                        {sp.receiptNote ? ` · ${sp.receiptNote}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                      <span
                        className={`badge ${
                          sp.status === 'approved' || sp.status === 'paid_demo'
                            ? 'ok'
                            : sp.status === 'pending'
                              ? 'warn'
                              : 'danger'
                        }`}
                      >
                        {sp.status === 'pending'
                          ? 'در انتظار'
                          : sp.status === 'approved'
                            ? 'تأیید'
                            : sp.status === 'rejected'
                              ? 'رد'
                              : 'پرداخت‌شده'}
                      </span>
                      {sp.status === 'pending' && (
                        <div className="grid-actions" style={{ gridTemplateColumns: '1fr 1fr' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ minHeight: 36, padding: '4px 8px' }}
                            onClick={() => {
                              reviewSubscriptionPayment(sp.id, 'approved', 'siteAdmin')
                              flash('فیش تأیید شد')
                            }}
                          >
                            تأیید
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ minHeight: 36, padding: '4px 8px' }}
                            onClick={() => reviewSubscriptionPayment(sp.id, 'rejected', 'siteAdmin')}
                          >
                            رد
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <span className="badge soon">درگاه واقعی — به‌زودی</span>
          </div>
        )}

        {section === 'tariffs' && (
          <div className="panel">
            <h3>تعرفه اشتراک (بر اساس واحد)</h3>
            <table className="price-table">
              <thead>
                <tr>
                  <th>پلن</th>
                  <th>تا واحد</th>
                  <th>ماهانه/واحد</th>
                  <th>انواع</th>
                </tr>
              </thead>
              <tbody>
                {platform.admin.tariffs.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{faNum(t.maxUnits)}</td>
                    <td>{toman(t.monthlyPerUnit)}</td>
                    <td>{t.buildingTypes.map((x) => buildingTypeLabel[x]).join('، ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => {
                upsertTariff({
                  id: `tr-${Date.now()}`,
                  name: 'سفارشی',
                  maxUnits: 20,
                  monthlyPerUnit: 40_000,
                  buildingTypes: ['block', 'building'],
                })
                flash('پلن تعرفه اضافه شد')
              }}
            >
              افزودن پلن نمونه
            </button>
          </div>
        )}

        {section === 'discounts' && (
          <>
            <div className="panel">
              <h3>کد تخفیف جدید</h3>
              <div className="field">
                <label>کد</label>
                <input
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })}
                />
              </div>
              <div className="grid-actions">
                <div className="field">
                  <label>درصد</label>
                  <input
                    type="number"
                    value={discountForm.percent}
                    onChange={(e) =>
                      setDiscountForm({ ...discountForm, percent: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="field">
                  <label>سقف استفاده</label>
                  <input
                    type="number"
                    value={discountForm.maxUses}
                    onChange={(e) =>
                      setDiscountForm({ ...discountForm, maxUses: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  if (!discountForm.code.trim()) return
                  upsertDiscount({
                    id: `dc-${Date.now()}`,
                    code: discountForm.code.trim().toUpperCase(),
                    percent: discountForm.percent,
                    maxUses: discountForm.maxUses,
                    usedCount: 0,
                    active: true,
                  })
                  setDiscountForm({ code: '', percent: 10, maxUses: 50 })
                  flash('کد تخفیف ذخیره شد')
                }}
              >
                ذخیره کد
              </button>
            </div>
            <div className="panel">
              <div className="list">
                {platform.admin.discounts.map((d) => (
                  <div className="list-item" key={d.id}>
                    <div>
                      <div className="title">{d.code}</div>
                      <div className="sub">
                        {faNum(d.percent)}٪ · استفاده {faNum(d.usedCount)}/{faNum(d.maxUses)}
                        {d.note ? ` · ${d.note}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => upsertDiscount({ ...d, active: !d.active })}
                    >
                      {d.active ? 'غیرفعال' : 'فعال'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {section === 'storage' && (
          <div className="panel">
            <h3>سهمیه فضای هر بلوک</h3>
            <div className="list">
              {platform.buildings.map((b) => (
                <div className="list-item" key={b.id}>
                  <div>
                    <div className="title">{b.name}</div>
                    <div className="sub">فعلی: {faNum(b.storageQuotaMb)} مگابایت</div>
                  </div>
                  <input
                    type="number"
                    style={{ width: 90, minHeight: 40, borderRadius: 10, border: '1px solid var(--line)', padding: 8 }}
                    value={b.storageQuotaMb}
                    onChange={(e) => setBuildingStorageQuota(b.id, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'users' && (
          <>
            <p className="lead">ایجاد و انتساب نقش: ادمین کل، مدیر شهرک، مدیر بلوک، مدیر مالی بلوک.</p>
            <button
              type="button"
              className="btn btn-copper"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={() => setUserForm(emptyUser())}
            >
              افزودن کاربر
            </button>
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
                    <option value="manager">{roleLabel.manager}</option>
                    <option value="financeManager">{roleLabel.financeManager}</option>
                  </select>
                </div>
                {(userForm.role === 'manager' || userForm.role === 'financeManager') && (
                  <div className="field">
                    <label>ساختمان / بلوک</label>
                    <select
                      value={userForm.buildingId ?? ''}
                      onChange={(e) => setUserForm({ ...userForm, buildingId: e.target.value })}
                    >
                      {platform.buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
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
                      flash('کاربر ذخیره شد')
                    }}
                  >
                    ذخیره
                  </button>
                </div>
              </div>
            )}
            {(platform.admin.users ?? []).map((u) => (
              <div className="panel" key={u.id}>
                <div className="list-item" style={{ paddingTop: 0 }}>
                  <div>
                    <div className="title">{u.displayName}</div>
                    <div className="sub">
                      {roleLabel[u.role]} · {u.username} / {u.password}
                      <br />
                      {u.buildingId
                        ? platform.buildings.find((b) => b.id === u.buildingId)?.name
                        : u.complexId
                          ? platform.admin.complexes.find((c) => c.id === u.complexId)?.name
                          : 'کل پلتفرم'}
                    </div>
                  </div>
                  <span className={`badge ${u.status === 'active' ? 'ok' : 'soon'}`}>
                    {u.status === 'active' ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => setUserForm({ ...u })}
                >
                  ویرایش
                </button>
              </div>
            ))}
          </>
        )}

        {section === 'features' && (
          <div className="panel">
            <h3>امکانات هر بلوک</h3>
            <p className="sub">تغییر بلافاصله ذخیره می‌شود و منو/مسیر اپ همان ساختمان را محدود می‌کند.</p>
            <div className="field">
              <label>انتخاب ساختمان</label>
              <select value={featBuildingId} onChange={(e) => setFeatBuildingId(e.target.value)}>
                {platform.buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {faNum(b.enabledFeatures.length)}/{faNum(FEATURE_CATALOG.length)} فعال
                  </option>
                ))}
              </select>
            </div>
            {(() => {
              const b = platform.buildings.find((x) => x.id === featBuildingId)
              if (!b) return null
              return (
                <div className="feature-toggles">
                  {FEATURE_CATALOG.map((f) => {
                    const on = b.enabledFeatures.includes(f.id)
                    return (
                      <label key={f.id} className={`feature-toggle ${on ? 'on' : 'off'}`}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...b.enabledFeatures, f.id]
                              : b.enabledFeatures.filter((id) => id !== f.id)
                            setBuildingFeatures(b.id, next as FeatureModuleId[])
                            flash(
                              e.target.checked
                                ? `«${f.label}» فعال شد`
                                : `«${f.label}» غیرفعال شد`,
                            )
                          }}
                        />
                        <span>
                          <strong>{f.label}</strong>
                          {f.hint ? <span className="sub"> — {f.hint}</span> : null}
                        </span>
                        <span className={`badge ${on ? 'ok' : 'soon'}`}>
                          {on ? 'فعال' : 'خاموش'}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {section === 'finance' && (
          <>
            <div className="panel">
              <h3>مانده صندوق ساختمان‌ها (میلیون تومان)</h3>
              <BarChart items={financeBars} />
            </div>
            <div className="panel">
              <h3>واریزی اشتراک‌ها</h3>
              <div className="sub">
                جمع تأیید/پرداخت‌شده:{' '}
                {toman(
                  platform.admin.subscriptionPayments
                    .filter((s) => s.status === 'approved' || s.status === 'paid_demo')
                    .reduce((a, s) => a + s.amount, 0),
                )}
              </div>
            </div>
          </>
        )}

        {section === 'activity' && (
          <>
            <div className="panel">
              <h3>نمودار فعالیت‌ها</h3>
              <BarChart items={activityByKind} />
            </div>
            <div className="panel">
              <h3>رویدادهای اخیر</h3>
              <div className="list">
                {platform.admin.activity.slice(0, 12).map((a) => (
                  <div className="list-item" key={a.id}>
                    <div>
                      <div className="title">{a.label}</div>
                      <div className="sub">
                        {a.kind} · {faDate(a.at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {section === 'sms' && (
          <div className="panel">
            <h3>وب‌سرویس پیامک</h3>
            <p className="sub">پیکربندی برای اتصال بعدی — ارسال واقعی stub است.</p>
            <div className="field">
              <label>Endpoint</label>
              <input
                value={platform.admin.sms.endpoint}
                onChange={(e) =>
                  updateSmsConfig({ ...platform.admin.sms, endpoint: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>API Key</label>
              <input
                value={platform.admin.sms.apiKey}
                onChange={(e) =>
                  updateSmsConfig({ ...platform.admin.sms, apiKey: e.target.value })
                }
                placeholder="ذخیره محلی دمو — در گیت کامیت نمی‌شود"
              />
            </div>
            <div className="field">
              <label>فرستنده</label>
              <input
                value={platform.admin.sms.sender}
                onChange={(e) =>
                  updateSmsConfig({ ...platform.admin.sms, sender: e.target.value })
                }
              />
            </div>
            <label style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={platform.admin.sms.enabled}
                onChange={(e) =>
                  updateSmsConfig({ ...platform.admin.sms, enabled: e.target.checked })
                }
              />
              فعال (stub)
            </label>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => flash(testSmsStub())}
            >
              تست ارسال (stub)
            </button>
            {platform.admin.sms.lastTestResult && (
              <div className="sub" style={{ marginTop: 8 }}>
                {platform.admin.sms.lastTestResult}
                {platform.admin.sms.lastTestAt
                  ? ` · ${faDate(platform.admin.sms.lastTestAt)}`
                  : ''}
              </div>
            )}
            <span className="badge soon" style={{ marginTop: 8 }}>
              پیامک واقعی — به‌زودی
            </span>
          </div>
        )}

        {section === 'gateway' && (
          <div className="panel">
            <h3>درگاه / فیش بانکی</h3>
            <div className="field">
              <label>حالت</label>
              <select
                value={platform.admin.gateway.mode}
                onChange={(e) =>
                  updateGatewayConfig({
                    ...platform.admin.gateway,
                    mode: e.target.value as typeof platform.admin.gateway.mode,
                  })
                }
              >
                <option value="gateway">فقط درگاه</option>
                <option value="bank_receipt">فقط فیش بانکی</option>
                <option value="both">هر دو</option>
              </select>
            </div>
            <div className="field">
              <label>Merchant ID</label>
              <input
                value={platform.admin.gateway.merchantId}
                onChange={(e) =>
                  updateGatewayConfig({ ...platform.admin.gateway, merchantId: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>Callback URL</label>
              <input
                value={platform.admin.gateway.callbackUrl}
                onChange={(e) =>
                  updateGatewayConfig({ ...platform.admin.gateway, callbackUrl: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>اطلاعات حساب برای فیش</label>
              <textarea
                value={platform.admin.gateway.bankAccountInfo}
                onChange={(e) =>
                  updateGatewayConfig({
                    ...platform.admin.gateway,
                    bankAccountInfo: e.target.value,
                  })
                }
              />
            </div>
            <span className="badge soon">اتصال PSP واقعی — به‌زودی</span>
          </div>
        )}

        {section === 'qarz' && (
          <div className="panel">
            <h3>صندوق‌های قرض‌الحسنه (همه ساختمان‌ها)</h3>
            <div className="list">
              {allQarz.map((q) => (
                <div className="list-item" key={`${q.buildingId}-${q.id}`}>
                  <div>
                    <div className="title">{q.title}</div>
                    <div className="sub">
                      {q.buildingName} · {toman(q.totalAmount)} · {faNum(q.periodMonths)} ماه
                    </div>
                  </div>
                  <span className="badge">{qarzStatusLabel[q.status]}</span>
                </div>
              ))}
              {allQarz.length === 0 && <div className="empty">صندوقی نیست.</div>}
            </div>
          </div>
        )}

        {section === 'complex' && (
          <>
            {platform.admin.complexes.map((c) => (
              <div className="panel" key={c.id}>
                <div className="title">{c.name}</div>
                <div className="sub">
                  {c.city} · مدیر: {c.managerName}
                  <br />
                  بلوک‌ها:{' '}
                  {c.blockIds
                    .map((id) => platform.buildings.find((b) => b.id === id)?.name ?? id)
                    .join('، ')}
                </div>
                <div className="grid-actions" style={{ marginTop: 10 }}>
                  <div className="field">
                    <label>نام کاربری مدیر شهرک</label>
                    <input
                      value={c.username}
                      onChange={(e) =>
                        upsertComplex({ ...c, username: e.target.value.trim() })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>رمز مدیر شهرک</label>
                    <input
                      value={c.password}
                      onChange={(e) => upsertComplex({ ...c, password: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => {
                    const linked = (platform.admin.users ?? []).find(
                      (u) => u.role === 'complexManager' && u.complexId === c.id,
                    )
                    if (linked) {
                      upsertUser({
                        ...linked,
                        username: c.username,
                        password: c.password,
                        displayName: c.managerName,
                      })
                    } else {
                      upsertUser({
                        id: `usr-cpx-${c.id}`,
                        username: c.username,
                        password: c.password,
                        role: 'complexManager',
                        displayName: c.managerName,
                        complexId: c.id,
                        status: 'active',
                      })
                    }
                    flash('حساب مدیر شهرک همگام شد')
                  }}
                >
                  همگام‌سازی حساب ورود مدیر شهرک
                </button>
                <h3 style={{ fontSize: '0.95rem', marginTop: 12 }}>تیم‌های فنی</h3>
                <div className="list">
                  {platform.admin.teams
                    .filter((t) => t.complexId === c.id)
                    .map((t) => (
                      <div className="list-item" key={t.id}>
                        <div className="title">{t.name}</div>
                        <div className="sub">{t.specialty}</div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            <div className="panel">
              <h3>تیکت‌های فنی شهرک</h3>
              <div className="list">
                {platform.admin.tickets.map((t) => {
                  const b = platform.buildings.find((x) => x.id === t.buildingId)
                  const team = platform.admin.teams.find((x) => x.id === t.assignedTeamId)
                  return (
                    <div key={t.id} style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
                      <div className="list-item" style={{ paddingTop: 0 }}>
                        <div>
                          <div className="title">{t.title}</div>
                          <div className="sub">
                            {b?.name} · {t.category} · {t.createdBy}
                            <br />
                            {team ? `تیم: ${team.name}` : 'بدون تیم'}
                          </div>
                        </div>
                        <span
                          className={`badge ${
                            t.status === 'resolved'
                              ? 'ok'
                              : t.status === 'in_progress'
                                ? 'warn'
                                : 'danger'
                          }`}
                        >
                          {t.status === 'open'
                            ? 'باز'
                            : t.status === 'in_progress'
                              ? 'در جریان'
                              : 'حل‌شده'}
                        </span>
                      </div>
                      <div className="grid-actions" style={{ marginTop: 6 }}>
                        <select
                          value={t.assignedTeamId ?? ''}
                          onChange={(e) =>
                            updateComplexTicket(t.id, {
                              assignedTeamId: e.target.value || undefined,
                              status: e.target.value ? 'in_progress' : t.status,
                            })
                          }
                        >
                          <option value="">تیم…</option>
                          {platform.admin.teams
                            .filter((tm) => tm.complexId === t.complexId)
                            .map((tm) => (
                              <option key={tm.id} value={tm.id}>
                                {tm.name}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ minHeight: 40 }}
                          onClick={() =>
                            updateComplexTicket(t.id, {
                              status: 'resolved',
                              resolutionNote: 'تأیید از پنل سایت',
                            })
                          }
                        >
                          حل‌شده
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Link className="btn btn-primary" to="/login" style={{ width: '100%', marginTop: 10 }}>
                ورود مدیر شهرک (از صفحه ورود)
              </Link>
            </div>
          </>
        )}

        <div className="panel" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => {
              if (confirm('بازنشانی کل دمو پلتفرم؟')) resetDemo()
            }}
          >
            بازنشانی دمو
          </button>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
