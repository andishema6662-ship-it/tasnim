import { useState } from 'react'
import {
  addonPrice,
  catalogOrDefault,
  hasPaidAddon,
  isFeatureEffectivelyEnabled,
  pendingAddon,
} from '../lib/features'
import { faNum, toman } from '../lib/format'
import {
  FEATURE_PRICING_LABEL,
  type FeatureCatalogEntry,
  type FeatureModuleId,
  type FeaturePricingMode,
  type SubPeriodMonths,
} from '../store/platformTypes'
import { useStore } from '../store/StoreContext'

type FeatTab = 'catalog' | 'buildings' | 'addons'

export function FeatureCatalogAdmin() {
  const {
    platform,
    upsertFeatureCatalog,
    setBuildingFeatures,
    purchaseFeatureAddon,
    reviewSubscriptionPayment,
  } = useStore()
  const [tab, setTab] = useState<FeatTab>('catalog')
  const [featBuildingId, setFeatBuildingId] = useState(platform.buildings[0]?.id ?? '')
  const [addonBuilding, setAddonBuilding] = useState(platform.buildings[0]?.id ?? '')
  const [addonFeature, setAddonFeature] = useState<FeatureModuleId>('qarz')
  const [addonMonths, setAddonMonths] = useState<SubPeriodMonths>(12)
  const [toast, setToast] = useState<string | null>(null)
  const catalog = catalogOrDefault(platform.admin.featureCatalog)
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2400)
  }

  const patchEntry = (id: FeatureModuleId, patch: Partial<FeatureCatalogEntry>) => {
    const next = catalog.map((e) => (e.id === id ? { ...e, ...patch } : e))
    upsertFeatureCatalog(next)
  }

  const paidModules = catalog.filter((e) => e.paidAddon)

  return (
    <>
      <p className="lead">
        یکجا پیش‌فرض امکانات ساختمان‌های جدید و قیمت افزونه‌های پولی را تعریف کنید. افزونه پولی فقط بعد
        از پرداخت/تأیید فیش فعال می‌شود.
      </p>
      <div className="chip-row admin-nav">
        {(
          [
            ['catalog', 'کاتالوگ و پیش‌فرض'],
            ['buildings', 'وضعیت ساختمان‌ها'],
            ['addons', 'خرید افزونه'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`chip ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'catalog' && (
        <div className="panel">
          <h3>کاتالوگ امکانات پلتفرم</h3>
          <p className="sub" style={{ marginTop: 0 }}>
            «پیش‌فرض روشن» فقط برای ساختمان‌های تازه‌ایجاد اعمال می‌شود. افزونه‌های پولی حتی با تیک
            روشن تا پرداخت فعال نمی‌شوند.
          </p>
          {catalog.map((f) => (
            <div
              key={f.id}
              style={{ borderBottom: '1px solid var(--line)', padding: '12px 0' }}
            >
              <div className="list-item" style={{ paddingTop: 0 }}>
                <div>
                  <div className="title">{f.label}</div>
                  <div className="sub">{f.hint ?? f.id}</div>
                </div>
                <span className={`badge ${f.paidAddon ? 'warn' : 'ok'}`}>
                  {f.paidAddon ? 'پولی' : 'پایه'}
                </span>
              </div>
              <label className="feature-toggle" style={{ marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={f.defaultEnabled}
                  onChange={(e) => {
                    patchEntry(f.id, { defaultEnabled: e.target.checked })
                    flash('پیش‌فرض ذخیره شد')
                  }}
                />
                <span>پیش‌فرض روشن برای ساختمان جدید</span>
              </label>
              <label className="feature-toggle" style={{ marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={f.paidAddon}
                  onChange={(e) => {
                    const paid = e.target.checked
                    patchEntry(f.id, {
                      paidAddon: paid,
                      pricingMode: paid
                        ? f.pricingMode === 'included'
                          ? 'period'
                          : f.pricingMode
                        : 'included',
                      defaultEnabled: paid ? false : f.defaultEnabled,
                    })
                    flash(paid ? 'به افزونه پولی تبدیل شد' : 'به امکان پایه برگشت')
                  }}
                />
                <span>افزونه پولی (فعال فقط بعد از پرداخت)</span>
              </label>
              {f.paidAddon && (
                <>
                  <div className="field">
                    <label>نوع قیمت‌گذاری</label>
                    <select
                      value={f.pricingMode}
                      onChange={(e) =>
                        patchEntry(f.id, {
                          pricingMode: e.target.value as FeaturePricingMode,
                        })
                      }
                    >
                      <option value="period">{FEATURE_PRICING_LABEL.period}</option>
                      <option value="one_time">{FEATURE_PRICING_LABEL.one_time}</option>
                    </select>
                  </div>
                  {f.pricingMode === 'period' ? (
                    <div className="grid-actions">
                      <div className="field">
                        <label>۳ ماهه (تومان)</label>
                        <input
                          type="number"
                          value={f.price3 ?? 0}
                          onChange={(e) =>
                            patchEntry(f.id, { price3: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="field">
                        <label>۶ ماهه</label>
                        <input
                          type="number"
                          value={f.price6 ?? 0}
                          onChange={(e) =>
                            patchEntry(f.id, { price6: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="field">
                        <label>۱۲ ماهه</label>
                        <input
                          type="number"
                          value={f.price12 ?? 0}
                          onChange={(e) =>
                            patchEntry(f.id, { price12: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="field">
                      <label>قیمت یک‌بار (تومان)</label>
                      <input
                        type="number"
                        value={f.oneTimePrice ?? 0}
                        onChange={(e) =>
                          patchEntry(f.id, { oneTimePrice: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'buildings' && (
        <div className="panel">
          <h3>امکانات هر بلوک</h3>
          <div className="field">
            <label>انتخاب ساختمان</label>
            <select value={featBuildingId} onChange={(e) => setFeatBuildingId(e.target.value)}>
              {platform.buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {(() => {
            const b = platform.buildings.find((x) => x.id === featBuildingId)
            if (!b) return null
            return (
              <div className="feature-toggles">
                {catalog.map((f) => {
                  const listed = b.enabledFeatures.includes(f.id)
                  const effective = isFeatureEffectivelyEnabled(
                    b,
                    f.id,
                    catalog,
                    platform.admin.subscriptionPayments,
                  )
                  const pending = pendingAddon(
                    b.id,
                    f.id,
                    platform.admin.subscriptionPayments,
                  )
                  const paid = hasPaidAddon(
                    b.id,
                    f.id,
                    platform.admin.subscriptionPayments,
                    f,
                  )
                  return (
                    <label
                      key={f.id}
                      className={`feature-toggle ${effective ? 'on' : 'off'}`}
                    >
                      <input
                        type="checkbox"
                        checked={listed}
                        onChange={(e) => {
                          if (e.target.checked && f.paidAddon && !paid) {
                            purchaseFeatureAddon({
                              buildingId: b.id,
                              featureId: f.id,
                              months: 12,
                              status: 'pending',
                            })
                            flash(
                              `«${f.label}» در انتظار پرداخت است — تا تأیید فعال نمی‌شود`,
                            )
                            return
                          }
                          const next = e.target.checked
                            ? [...b.enabledFeatures, f.id]
                            : b.enabledFeatures.filter((id) => id !== f.id)
                          setBuildingFeatures(b.id, next)
                          flash(
                            e.target.checked
                              ? effective || !f.paidAddon
                                ? `«${f.label}» فعال شد`
                                : `«${f.label}» در لیست است ولی منتظر پرداخت`
                              : `«${f.label}» خاموش شد`,
                          )
                        }}
                      />
                      <span>
                        <strong>{f.label}</strong>
                        {f.paidAddon ? (
                          <span className="sub">
                            {' '}
                            — پولی
                            {paid
                              ? ' · پرداخت‌شده'
                              : pending
                                ? ' · در انتظار پرداخت'
                                : ' · نیاز به خرید'}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`badge ${
                          effective ? 'ok' : pending ? 'warn' : 'soon'
                        }`}
                      >
                        {effective ? 'فعال' : pending ? 'منتظر پرداخت' : 'خاموش'}
                      </span>
                    </label>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {tab === 'addons' && (
        <>
          <div className="panel">
            <h3>ثبت خرید / درخواست افزونه</h3>
            <div className="field">
              <label>ساختمان</label>
              <select value={addonBuilding} onChange={(e) => setAddonBuilding(e.target.value)}>
                {platform.buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>افزونه</label>
              <select
                value={addonFeature}
                onChange={(e) => setAddonFeature(e.target.value as FeatureModuleId)}
              >
                {paidModules.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} — {FEATURE_PRICING_LABEL[f.pricingMode]}
                  </option>
                ))}
              </select>
            </div>
            {(() => {
              const entry = paidModules.find((f) => f.id === addonFeature)
              if (!entry) return null
              return (
                <>
                  {entry.pricingMode === 'period' && (
                    <div className="field">
                      <label>دوره</label>
                      <div className="chip-row">
                        {([3, 6, 12] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            className={`chip ${addonMonths === m ? 'active' : ''}`}
                            onClick={() => setAddonMonths(m)}
                          >
                            {faNum(m)} ماهه — {toman(addonPrice(entry, m))}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {entry.pricingMode === 'one_time' && (
                    <div className="sub">مبلغ یک‌بار: {toman(addonPrice(entry))}</div>
                  )}
                  <div className="grid-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        purchaseFeatureAddon({
                          buildingId: addonBuilding,
                          featureId: addonFeature,
                          months: addonMonths,
                          status: 'pending',
                        })
                        flash('درخواست ثبت شد — تا تأیید پرداخت فعال نیست')
                      }}
                    >
                      ثبت فیش (در انتظار)
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        purchaseFeatureAddon({
                          buildingId: addonBuilding,
                          featureId: addonFeature,
                          months: addonMonths,
                          status: 'paid_demo',
                          method: 'gateway',
                        })
                        flash('پرداخت دمو — افزونه فعال شد')
                      }}
                    >
                      پرداخت دمو و فعال‌سازی
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
          <div className="panel">
            <h3>فیش‌های افزونه در انتظار</h3>
            <div className="list">
              {platform.admin.subscriptionPayments
                .filter((sp) => sp.addonFeatureId && sp.status === 'pending')
                .map((sp) => {
                  const b = platform.buildings.find((x) => x.id === sp.buildingId)
                  const f = catalog.find((x) => x.id === sp.addonFeatureId)
                  return (
                    <div key={sp.id} style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
                      <div className="list-item" style={{ paddingTop: 0 }}>
                        <div>
                          <div className="title">
                            {f?.label ?? sp.addonFeatureId} — {b?.name}
                          </div>
                          <div className="sub">
                            {toman(sp.amount)} · {sp.trackingCode}
                            <br />
                            {sp.receiptNote}
                          </div>
                        </div>
                        <span className="badge warn">در انتظار</span>
                      </div>
                      <div className="grid-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            reviewSubscriptionPayment(sp.id, 'approved', 'siteAdmin')
                            flash('تأیید شد — افزونه فعال')
                          }}
                        >
                          تأیید و فعال‌سازی
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            reviewSubscriptionPayment(sp.id, 'rejected', 'siteAdmin')
                            flash('رد شد')
                          }}
                        >
                          رد
                        </button>
                      </div>
                    </div>
                  )
                })}
              {platform.admin.subscriptionPayments.filter(
                (sp) => sp.addonFeatureId && sp.status === 'pending',
              ).length === 0 && <div className="empty">فیش معلقی نیست.</div>}
            </div>
          </div>
        </>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
