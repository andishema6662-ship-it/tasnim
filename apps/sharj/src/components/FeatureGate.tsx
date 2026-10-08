import { useLocation } from 'react-router-dom'
import { effectiveFeatureSet } from '../lib/features'
import { catalogOrDefault } from '../lib/features'
import { FEATURE_CATALOG, featureForPath } from '../store/platformTypes'
import { useBuildingState, useStore } from '../store/StoreContext'

export function FeatureDisabled({ featureLabel }: { featureLabel?: string }) {
  return (
    <div className="page">
      <h2>امکان غیرفعال</h2>
      <p className="lead">
        {featureLabel
          ? `«${featureLabel}» برای این ساختمان فعال نیست.`
          : 'این امکان برای این ساختمان فعال نیست.'}
      </p>
      <p className="sub">
        اگر افزونه پولی است، پس از تأیید پرداخت در پنل سایت فعال می‌شود؛ در غیر این صورت مدیر سایت از
        بخش امکانات آن را روشن می‌کند.
      </p>
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
  const label =
    catalog.find((f) => f.id === featureId)?.label ??
    FEATURE_CATALOG.find((f) => f.id === featureId)?.label
  return <FeatureDisabled featureLabel={label} />
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
  id: import('../store/platformTypes').FeatureModuleId
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const features = useBuildingFeatures()
  if (!features.has(id)) return <>{fallback}</>
  return <>{children}</>
}
