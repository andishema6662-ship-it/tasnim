import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import {
  addonPrice,
  catalogOrDefault,
  featureEntry,
  hasPaidAddon,
  pendingAddon,
} from '../lib/features'
import { faNum, toman } from '../lib/format'
import {
  defaultCallbackUrl,
  saveZarinpalIntent,
  zarinpalRequest,
} from '../lib/zarinpal'
import {
  FEATURE_PRICING_LABEL,
  type FeatureModuleId,
  type SubPeriodMonths,
} from '../store/platformTypes'
import { useStore } from '../store/StoreContext'

/**
 * Unlock flow: tariff → payment → ZarinPal / paid_demo unlocks the feature.
 */
export function FeatureActivate() {
  const { featureId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { platform, session, purchaseFeatureAddon } = useStore()
  const [months, setMonths] = useState<SubPeriodMonths>(12)
  const [step, setStep] = useState<'tariff' | 'pay' | 'done'>('tariff')
  const [toast, setToast] = useState<string | null>(null)
  const [tracking, setTracking] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const gw = platform.admin.gateway
  const gatewayOnline = gw.enabled && (gw.mode === 'gateway' || gw.mode === 'both')

  const catalog = catalogOrDefault(platform.admin.featureCatalog)
  const entry = featureEntry(featureId as FeatureModuleId, catalog)

  const buildingId = useMemo(() => {
    const fromQuery = params.get('buildingId')
    if (fromQuery) return fromQuery
    if (session?.role === 'manager' || session?.role === 'financeManager') {
      return session.buildingId
    }
    if (session?.role === 'complexManager' && session.complexId) {
      const cpx = platform.admin.complexes.find((c) => c.id === session.complexId)
      return cpx?.blockIds[0] ?? platform.buildings[0]?.id
    }
    return platform.buildings[0]?.id
  }, [params, session, platform])

  const [selectedBuilding, setSelectedBuilding] = useState(buildingId ?? '')

  const buildings = useMemo(() => {
    if (session?.role === 'complexManager' && session.complexId) {
      const cpx = platform.admin.complexes.find((c) => c.id === session.complexId)
      return platform.buildings.filter((b) => cpx?.blockIds.includes(b.id))
    }
    if (session?.buildingId) {
      return platform.buildings.filter((b) => b.id === session.buildingId)
    }
    return platform.buildings
  }, [platform.buildings, platform.admin.complexes, session])

  const activeBuildingId = selectedBuilding || buildingId || ''
  const meta = platform.buildings.find((b) => b.id === activeBuildingId)
  const already = entry
    ? hasPaidAddon(activeBuildingId, entry.id, platform.admin.subscriptionPayments, entry)
    : false
  const pending = entry
    ? pendingAddon(activeBuildingId, entry.id, platform.admin.subscriptionPayments)
    : undefined

  if (!session || (session.role !== 'manager' && session.role !== 'complexManager' && session.role !== 'siteAdmin')) {
    return (
      <div className="app-shell auth">
        <div className="page" style={{ paddingTop: 40 }}>
          <h2>فعال‌سازی امکان</h2>
          <p className="lead">با حساب مدیر بلوک یا مدیر شهرک وارد شوید.</p>
          <Link className="btn btn-primary" to="/login">
            ورود
          </Link>
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="app-shell auth">
        <div className="page" style={{ paddingTop: 40 }}>
          <h2>امکان یافت نشد</h2>
          <Link className="btn btn-secondary" to="/app">
            بازگشت
          </Link>
        </div>
      </div>
    )
  }

  const price = addonPrice(entry, months)
  const returnPath = FEATURE_RETURN[entry.id] ?? '/app/more'

  const payDemo = () => {
    const id = purchaseFeatureAddon({
      buildingId: activeBuildingId,
      featureId: entry.id,
      months: entry.pricingMode === 'period' ? months : undefined,
      method: 'gateway',
      status: 'paid_demo',
      receiptNote: `پرداخت دمو — فعال‌سازی ${entry.label}`,
    })
    if (id) {
      setTracking(id)
      setStep('done')
      setToast('پرداخت موفق — امکان فعال شد')
      setTimeout(() => setToast(null), 2500)
    } else {
      setToast('پرداخت ناموفق — دسترسی یا ساختمان را بررسی کنید')
      setTimeout(() => setToast(null), 2500)
    }
  }

  const payPending = () => {
    const id = purchaseFeatureAddon({
      buildingId: activeBuildingId,
      featureId: entry.id,
      months: entry.pricingMode === 'period' ? months : undefined,
      method: 'bank_receipt',
      status: 'pending',
      receiptNote: `فیش بانکی — ${entry.label}`,
    })
    if (id) {
      setToast('درخواست ثبت شد — پس از تأیید ادمین فعال می‌شود')
      setTimeout(() => setToast(null), 2800)
      setStep('done')
    }
  }

  const payZarinpal = async () => {
    if (!entry) return
    if (price < 1000) {
      setToast('حداقل مبلغ درگاه ۱٬۰۰۰ تومان است')
      setTimeout(() => setToast(null), 3000)
      return
    }
    setPaying(true)
    const id = purchaseFeatureAddon({
      buildingId: activeBuildingId,
      featureId: entry.id,
      months: entry.pricingMode === 'period' ? months : undefined,
      method: 'gateway',
      status: 'pending',
      receiptNote: `در انتظار زرین‌پال — ${entry.label}`,
    })
    if (!id) {
      setPaying(false)
      setToast('ثبت سفارش ممکن نشد')
      setTimeout(() => setToast(null), 3000)
      return
    }
    try {
      const callbackUrl = defaultCallbackUrl(gw.callbackUrl)
      saveZarinpalIntent({
        kind: 'feature_addon',
        orderId: id,
        amountToman: price,
        description: `شارژبان — افزونه ${entry.label}`,
        featureId: entry.id,
        buildingId: activeBuildingId,
        months: entry.pricingMode === 'period' ? months : undefined,
        createdAt: new Date().toISOString(),
      })
      const req = await zarinpalRequest({
        amountToman: price,
        description: `شارژبان — افزونه ${entry.label}`,
        callbackUrl,
        orderId: id,
      })
      saveZarinpalIntent({
        kind: 'feature_addon',
        orderId: id,
        amountToman: price,
        description: `شارژبان — افزونه ${entry.label}`,
        featureId: entry.id,
        buildingId: activeBuildingId,
        months: entry.pricingMode === 'period' ? months : undefined,
        authority: req.authority,
        createdAt: new Date().toISOString(),
      })
      window.location.href = req.start_pay_url
    } catch (e) {
      setPaying(false)
      setToast(e instanceof Error ? e.message : 'خطا در اتصال به درگاه')
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <div className="app-shell auth wide">
      <div className="page" style={{ paddingTop: 18 }}>
        <header className="topbar">
          <BrandLogo variant="stacked" tag="فعال‌سازی امکان" />
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              if (window.history.length > 1) navigate(-1)
              else navigate('/app/more')
            }}
          >
            بازگشت
          </button>
        </header>

        <h2>{entry.label}</h2>
        <p className="lead">
          مسیر فعال‌سازی: تعرفه → پرداخت → باز شدن امکان برای ساختمان انتخابی.
        </p>

        <div className="unlock-steps">
          <span className={step === 'tariff' ? 'on' : ''}>۱. تعرفه</span>
          <span className={step === 'pay' ? 'on' : ''}>۲. پرداخت</span>
          <span className={step === 'done' ? 'on' : ''}>۳. فعال</span>
        </div>

        {buildings.length > 1 && (
          <div className="field">
            <label>ساختمان / بلوک هدف</label>
            <select
              value={activeBuildingId}
              onChange={(e) => setSelectedBuilding(e.target.value)}
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {already && (
          <div className="panel">
            <p className="lead" style={{ margin: 0 }}>
              این امکان برای «{meta?.name}» از قبل فعال است.
            </p>
            <Link className="btn btn-primary" to={returnPath} style={{ width: '100%', marginTop: 12 }}>
              رفتن به بخش
            </Link>
          </div>
        )}

        {!already && !entry.paidAddon && (
          <div className="panel">
            <p className="sub">
              این ماژول افزونه پولی نیست. از ادمین کل سایت بخواهید آن را در «امکانات» ساختمان روشن کند.
            </p>
            <Link className="btn btn-secondary" to="/app/more" style={{ width: '100%' }}>
              بازگشت به بیشتر
            </Link>
          </div>
        )}

        {!already && entry.paidAddon && step === 'tariff' && (
          <div className="panel unlock-tariff">
            <h3>تعرفه پولی</h3>
            <p className="sub">{entry.hint ?? FEATURE_PRICING_LABEL[entry.pricingMode]}</p>
            {entry.pricingMode === 'period' ? (
              <div className="unlock-price-grid">
                {(
                  [
                    [3, entry.price3],
                    [6, entry.price6],
                    [12, entry.price12],
                  ] as const
                ).map(([m, p]) =>
                  p ? (
                    <button
                      key={m}
                      type="button"
                      className={`unlock-price ${months === m ? 'active' : ''}`}
                      onClick={() => setMonths(m)}
                    >
                      <strong>{faNum(m)} ماهه</strong>
                      <span>{toman(p)}</span>
                    </button>
                  ) : null,
                )}
              </div>
            ) : (
              <div className="unlock-price active">
                <strong>یک‌بار پرداخت</strong>
                <span>{toman(entry.oneTimePrice ?? 0)}</span>
              </div>
            )}
            <div className="sub" style={{ marginTop: 12 }}>
              مبلغ انتخابی: <strong>{toman(price)}</strong> · ساختمان: {meta?.name}
            </div>
            {pending && (
              <div className="badge warn" style={{ marginTop: 8 }}>
                فیش در انتظار تأیید: {pending.trackingCode}
              </div>
            )}
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 14 }}
              onClick={() => setStep('pay')}
            >
              ادامه به پرداخت
            </button>
          </div>
        )}

        {!already && entry.paidAddon && step === 'pay' && (
          <div className="panel">
            <h3>صفحه پرداخت</h3>
            <p className="sub">
              {entry.label} — {toman(price)}
              {entry.pricingMode === 'period' ? ` · ${faNum(months)} ماه` : ' · یک‌بار'}
            </p>
            {gatewayOnline && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: 10 }}
                disabled={paying}
                onClick={() => void payZarinpal()}
              >
                پرداخت آنلاین زرین‌پال{gw.sandbox ? ' (سندباکس)' : ''}
              </button>
            )}
            <button
              type="button"
              className="btn btn-copper"
              style={{ width: '100%', marginBottom: 10 }}
              onClick={payDemo}
            >
              پرداخت موفق (دمو) و فعال‌سازی فوری
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: 10 }}
              onClick={payPending}
            >
              ثبت فیش بانکی (در انتظار تأیید ادمین)
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%' }}
              onClick={() => setStep('tariff')}
            >
              بازگشت به تعرفه
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="panel">
            <h3>نتیجه</h3>
            <p className="lead">
              {already || tracking
                ? 'امکان برای ساختمان شما باز شد (یا درخواست ثبت شد).'
                : 'وضعیت به‌روز شد.'}
            </p>
            {tracking && <div className="sub">کد پیگیری: {tracking}</div>}
            <Link className="btn btn-primary" to={returnPath} style={{ width: '100%', marginTop: 12 }}>
              ورود به بخش فعال‌شده
            </Link>
          </div>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

const FEATURE_RETURN: Partial<Record<FeatureModuleId, string>> = {
  meetings: '/app/meetings',
  qarz: '/app/qarz',
  chat: '/app/chat',
  suggestions: '/app/suggestions',
  polls: '/app/polls',
  news: '/app/news',
  finance: '/app/finance',
  charges: '/app/charges',
  payments: '/app/payments',
  blockTickets: '/app/block-tickets',
  installments: '/app/bills',
}
