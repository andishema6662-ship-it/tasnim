import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { faDate, faNum, toman } from '../lib/format'
import type { Complex, SiteAdminSection } from '../store/platformTypes'
import { useStore } from '../store/StoreContext'
import { BroadcastBanner } from '../components/BroadcastBanner'
import { BroadcastsPanel } from './BroadcastsPanel'
import { FeatureCatalogAdmin } from './FeatureCatalogAdmin'
import { SideProgramsPanel } from './SideProgramsPanel'
import { SiteSuggestionsReview } from './SiteSuggestionsPanel'
import { SubscriptionReports } from './SubscriptionReports'
import { SiteAdminChangelog } from './siteAdmin/SiteAdminChangelog'
import { SiteAdminChat, SiteAdminChatDock } from './siteAdmin/SiteAdminChat'
import { SiteAdminDashboard } from './siteAdmin/SiteAdminDashboard'
import { SiteAdminFinance } from './siteAdmin/SiteAdminFinance'
import { SiteAdminProperties } from './siteAdmin/SiteAdminProperties'
import { SiteAdminQarz } from './siteAdmin/SiteAdminQarz'
import { SiteAdminSupport } from './siteAdmin/SiteAdminSupport'
import { SiteAdminTeams } from './siteAdmin/SiteAdminTeams'
import { SiteAdminUsers } from './siteAdmin/SiteAdminUsers'
import { buildingTypeLabel } from '../store/types'

const SECTIONS: { id: SiteAdminSection; label: string }[] = [
  { id: 'dashboard', label: 'داشبورد' },
  { id: 'properties', label: 'املاک' },
  { id: 'users', label: 'کاربران' },
  { id: 'teams', label: 'تیم‌های فنی' },
  { id: 'subscriptions', label: 'اشتراک' },
  { id: 'tariffs', label: 'تعرفه' },
  { id: 'discounts', label: 'تخفیف' },
  { id: 'storage', label: 'محدودیت فضای ابری' },
  { id: 'features', label: 'امکانات' },
  { id: 'broadcasts', label: 'پیام مدیر' },
  { id: 'programs', label: 'برنامه‌ها' },
  { id: 'proposals', label: 'پیشنهادات مدیران' },
  { id: 'finance', label: 'مالی' },
  { id: 'qarz', label: 'صندوق قرض‌الحسنه' },
  { id: 'support', label: 'پشتیبانی' },
  { id: 'chat', label: 'چت' },
  { id: 'changelog', label: 'بروزرسانی‌ها' },
  { id: 'activity', label: 'فعالیت' },
  { id: 'sms', label: 'پیامک' },
  { id: 'gateway', label: 'درگاه' },
  { id: 'complex', label: 'شهرک/تیکت' },
]

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
    logout,
    resetDemo,
    reloadFromStorage,
    upsertDiscount,
    upsertTariff,
    updateSmsConfig,
    testSmsStub,
    updateGatewayConfig,
    reviewSubscriptionPayment,
    setBuildingStorageQuota,
    updateComplexTicket,
    upsertUser,
    upsertComplex,
  } = useStore()
  const navigate = useNavigate()
  const [section, setSection] = useState<SiteAdminSection>('dashboard')
  const [navOpen, setNavOpen] = useState(false)
  const [chatDockOpen, setChatDockOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [discountForm, setDiscountForm] = useState({
    code: '',
    percent: 10,
    maxUses: 50,
  })
  const [complexForm, setComplexForm] = useState<Complex | null>(null)

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2400)
  }

  const activityByKind = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of platform.admin.activity) {
      map.set(a.kind, (map.get(a.kind) ?? 0) + 1)
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }))
  }, [platform.admin.activity])

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

  const sectionLabel = SECTIONS.find((s) => s.id === section)?.label ?? ''

  const selectSection = (id: SiteAdminSection) => {
    setSection(id)
    setNavOpen(false)
  }

  const emptyComplex = (): Complex => ({
    id: `cpx-${Date.now()}`,
    name: '',
    city: '',
    managerName: '',
    username: '',
    password: '',
    blockIds: [],
    status: 'active',
  })

  return (
    <div className="app-shell auth wide site-admin-shell">
      <div className="page site-admin-page" style={{ paddingTop: 18 }}>
        <header className="topbar">
          <div className="brand-mark">
            <div className="logo">د</div>
            <div>
              <div className="name">شارژبان</div>
              <span className="tag">پنل مدیریت سایت</span>
            </div>
          </div>
          <div className="site-admin-top-actions">
            <button
              type="button"
              className="btn btn-secondary site-admin-menu-btn"
              aria-expanded={navOpen}
              aria-controls="site-admin-sidebar"
              onClick={() => setNavOpen((v) => !v)}
            >
              {navOpen ? 'بستن منو' : 'منوها'}
            </button>
            <div style={{ textAlign: 'left' }}>
              <div className="meta">{session.displayName}</div>
              <div className="topbar-actions">
                <button
                  className="btn-ghost refresh-btn"
                  type="button"
                  title="بروزرسانی داده"
                  aria-label="بروزرسانی داده"
                  onClick={() => reloadFromStorage()}
                >
                  ↻
                </button>
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
            </div>
          </div>
        </header>

        {section === 'dashboard' ? (
          <h2>مرکز مدیریت پلتفرم</h2>
        ) : (
          <h2>{sectionLabel}</h2>
        )}
        {section === 'dashboard' && (
          <p className="lead">
            داشبورد، املاک، کاربران، مالی، پشتیبانی و صندوق — منوی راست همیشه در دسترس است.
          </p>
        )}
        <BroadcastBanner />

        <div className={`site-admin-layout ${navOpen ? 'nav-open' : ''}`}>
          {navOpen && (
            <button
              type="button"
              className="site-admin-backdrop"
              aria-label="بستن منو"
              onClick={() => setNavOpen(false)}
            />
          )}
          <aside
            id="site-admin-sidebar"
            className={`site-admin-sidebar ${navOpen ? 'open' : ''}`}
            aria-label="منوی مدیریت سایت"
          >
            <div className="site-admin-sidebar__title">منوها</div>
            <nav className="site-admin-nav">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`site-admin-nav__item ${section === s.id ? 'active' : ''}`}
                  onClick={() => selectSection(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="site-admin-main">
            {section !== 'dashboard' && (
              <div className="site-admin-section-label">
                بخش فعال: <strong>{sectionLabel}</strong>
              </div>
            )}

            {section === 'dashboard' && (
              <SiteAdminDashboard onNavigate={selectSection} />
            )}
            {section === 'properties' && <SiteAdminProperties onFlash={flash} />}
            {section === 'users' && <SiteAdminUsers onFlash={flash} />}
            {section === 'teams' && <SiteAdminTeams onFlash={flash} />}
            {section === 'finance' && <SiteAdminFinance />}
            {section === 'qarz' && <SiteAdminQarz onFlash={flash} />}
            {section === 'support' && <SiteAdminSupport onFlash={flash} />}
            {section === 'chat' && <SiteAdminChat />}
            {section === 'changelog' && <SiteAdminChangelog />}

            {section === 'subscriptions' && (
              <>
                <p className="lead">
                  پرداخت حق اشتراک با تاریخ شمسی، دوره ۳/۶/۱۲ ماهه، گزارش بدهی و پرداختی و جمع کل.
                </p>
                <SubscriptionReports
                  onReview={(id, status) => {
                    reviewSubscriptionPayment(id, status, 'siteAdmin')
                    flash(status === 'approved' ? 'فیش تأیید شد' : 'فیش رد شد')
                  }}
                />
                <span className="badge soon">درگاه واقعی — به‌زودی</span>
              </>
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
                      onChange={(e) =>
                        setDiscountForm({ ...discountForm, code: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid-actions">
                    <div className="field">
                      <label>درصد</label>
                      <input
                        type="number"
                        value={discountForm.percent}
                        onChange={(e) =>
                          setDiscountForm({
                            ...discountForm,
                            percent: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>سقف استفاده</label>
                      <input
                        type="number"
                        value={discountForm.maxUses}
                        onChange={(e) =>
                          setDiscountForm({
                            ...discountForm,
                            maxUses: Number(e.target.value),
                          })
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
                            {faNum(d.percent)}٪ · استفاده {faNum(d.usedCount)}/
                            {faNum(d.maxUses)}
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
                <h3>محدودیت فضای ابری هر ملک</h3>
                <p className="sub">سهمیه ذخیره‌سازی (مگابایت) برای آرشیو رسید و رسانه.</p>
                <div className="list">
                  {platform.buildings.map((b) => (
                    <div className="list-item" key={b.id}>
                      <div>
                        <div className="title">{b.name}</div>
                        <div className="sub">فعلی: {faNum(b.storageQuotaMb)} مگابایت</div>
                      </div>
                      <input
                        type="number"
                        style={{
                          width: 90,
                          minHeight: 40,
                          borderRadius: 10,
                          border: '1px solid var(--line)',
                          padding: 8,
                        }}
                        value={b.storageQuotaMb}
                        onChange={(e) =>
                          setBuildingStorageQuota(b.id, Number(e.target.value))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === 'features' && <FeatureCatalogAdmin />}
            {section === 'broadcasts' && (
              <BroadcastsPanel role="siteAdmin" displayName={session.displayName} />
            )}
            {section === 'programs' && (
              <SideProgramsPanel role="siteAdmin" displayName={session.displayName} />
            )}
            {section === 'proposals' && <SiteSuggestionsReview filterRole="siteAdmin" />}

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
                      updateGatewayConfig({
                        ...platform.admin.gateway,
                        merchantId: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label>Callback URL</label>
                  <input
                    value={platform.admin.gateway.callbackUrl}
                    onChange={(e) =>
                      updateGatewayConfig({
                        ...platform.admin.gateway,
                        callbackUrl: e.target.value,
                      })
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
              </div>
            )}

            {section === 'complex' && (
              <>
                <p className="sub">مدیریت شهرک‌ها و تیکت‌های فنی بلوک‌ها.</p>
                <button
                  type="button"
                  className="btn btn-copper"
                  style={{ width: '100%', marginBottom: 12 }}
                  onClick={() => setComplexForm(emptyComplex())}
                >
                  افزودن شهرک
                </button>
                {complexForm && (
                  <div className="panel">
                    <h3>شهرک جدید</h3>
                    <div className="field">
                      <label>نام</label>
                      <input
                        value={complexForm.name}
                        onChange={(e) =>
                          setComplexForm({ ...complexForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setComplexForm(null)}
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (!complexForm.name.trim()) return
                          const saved: Complex = {
                            ...complexForm,
                            name: complexForm.name.trim(),
                            city: complexForm.city || '—',
                            managerName: complexForm.managerName || 'مدیر شهرک',
                            username:
                              complexForm.username || `cpx${String(Date.now()).slice(-4)}`,
                            password: complexForm.password || 'complex123',
                          }
                          upsertComplex(saved)
                          upsertUser({
                            id: `usr-cpx-${saved.id}`,
                            username: saved.username,
                            password: saved.password,
                            role: 'complexManager',
                            displayName: saved.managerName,
                            complexId: saved.id,
                            status: 'active',
                          })
                          setComplexForm(null)
                          flash('شهرک ذخیره شد')
                        }}
                      >
                        ذخیره
                      </button>
                    </div>
                  </div>
                )}
                {platform.admin.complexes.map((c) => (
                  <div className="panel" key={c.id}>
                    <div className="title">{c.name}</div>
                    <div className="sub">
                      {c.city} · مدیر: {c.managerName}
                    </div>
                  </div>
                ))}
                <div className="panel">
                  <h3>تیکت‌های فنی شهرک</h3>
                  <div className="list">
                    {platform.admin.tickets.map((t) => {
                      const b = platform.buildings.find((x) => x.id === t.buildingId)
                      return (
                        <div
                          key={t.id}
                          style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}
                        >
                          <div className="list-item" style={{ paddingTop: 0 }}>
                            <div>
                              <div className="title">{t.title}</div>
                              <div className="sub">
                                {b?.name} · {t.category}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary"
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
        </div>
      </div>

      {section !== 'chat' && (
        <SiteAdminChatDock open={chatDockOpen} onToggle={() => setChatDockOpen((v) => !v)} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
