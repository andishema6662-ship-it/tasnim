import { Link, useLocation } from 'react-router-dom'
import {
  catalogOrDefault,
  effectiveFeatureSet,
  featureEntry,
} from '../lib/features'
import { FEATURE_CATALOG, featureForPath, type FeatureModuleId } from '../store/platformTypes'
import { useBuildingState, useStore } from '../store/StoreContext'

export function FeatureDisabled({
  featureId,
  featureLabel,
  paidAddon,
}: {
  featureId?: FeatureModuleId
  featureLabel?: string
  paidAddon?: boolean
}) {
  const { session } = useStore()
  const state = useBuildingState()
  const canUnlock =
    session?.role === 'manager' ||
    session?.role === 'complexManager' ||
    session?.role === 'siteAdmin'
  const activateTo = featureId
    ? `/app/activate/${featureId}?buildingId=${encodeURIComponent(state.buildingId)}`
    : '/app/more'

  return (
    <div className="page">
      <div className="panel unlock-cta-panel">
        <h2>امکان غیرفعال</h2>
        <p className="lead">
          {featureLabel
            ? `«${featureLabel}» برای این ساختمان فعال نیست.`
            : 'این امکان برای این ساختمان فعال نیست.'}
        </p>
        {paidAddon ? (
          <p className="sub">
            این ماژول افزونه پولی است. برای دیدن تعرفه و پرداخت، دکمه زیر را بزنید — پس از پرداخت موفق
            بخش باز می‌شود.
          </p>
        ) : (
          <p className="sub">
            در صورت افزونه پولی بودن، از مسیر فعال‌سازی اقدام کنید؛ وگرنه ادمین سایت از بخش امکانات آن
            را روشن می‌کند.
          </p>
        )}
        {canUnlock && featureId && (
          <Link className="btn btn-copper unlock-cta" to={activateTo}>
            برای فعال‌سازی کلیک کنید
          </Link>
        )}
      </div>
    </div>
  )
}

/** Wrap a building-scoped route; shows friendly message when feature off or unpaid. */
export function FeatureGate({ children }: { children: React.ReactNode }) {
  const { platform } = useStore()
  const state = useBuildingState()
  const location = useLocation()
  const featureId = featureForPath(location.pathname)
  if (!featureId) return <>{children}</>

  const meta = platform.buildings.find((b) => b.id === state.buildingId)
  const enabled = effectiveFeatureSet(
    meta,
    platform.admin.featureCatalog,
    platform.admin.subscriptionPayments,
  ).has(featureId)
  if (enabled) return <>{children}</>

  const catalog = catalogOrDefault(platform.admin.featureCatalog)
  const entry = featureEntry(featureId, catalog)
  const label =
    entry?.label ?? FEATURE_CATALOG.find((f) => f.id === featureId)?.label
  return (
    <FeatureDisabled
      featureId={featureId}
      featureLabel={label}
      paidAddon={Boolean(entry?.paidAddon)}
    />
  )
}

export function useBuildingFeatures(): Set<string> {
  const { platform } = useStore()
  const state = useBuildingState()
  const meta = platform.buildings.find((b) => b.id === state.buildingId)
  return effectiveFeatureSet(
    meta,
    platform.admin.featureCatalog,
    platform.admin.subscriptionPayments,
  )
}

export function RequireFeature({
  id,
  children,
  fallback = null,
}: {
  id: FeatureModuleId
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const features = useBuildingFeatures()
  if (!features.has(id)) return <>{fallback}</>
  return <>{children}</>
}
