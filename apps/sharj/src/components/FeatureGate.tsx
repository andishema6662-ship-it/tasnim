import { useLocation } from 'react-router-dom'
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
      <p className="sub">مدیر سایت می‌تواند از بخش امکانات پنل سایت آن را فعال کند.</p>
    </div>
  )
}

/** Wrap a building-scoped route; redirects/shows friendly message when feature off. */
export function FeatureGate({ children }: { children: React.ReactNode }) {
  const { platform } = useStore()
  const state = useBuildingState()
  const location = useLocation()
  const featureId = featureForPath(location.pathname)
  if (!featureId) return <>{children}</>

  const meta = platform.buildings.find((b) => b.id === state.buildingId)
  const enabled = meta?.enabledFeatures.includes(featureId) ?? true
  if (enabled) return <>{children}</>

  const label = FEATURE_CATALOG.find((f) => f.id === featureId)?.label
  return <FeatureDisabled featureLabel={label} />
}

export function useBuildingFeatures(): Set<string> {
  const { platform } = useStore()
  const state = useBuildingState()
  const meta = platform.buildings.find((b) => b.id === state.buildingId)
  return new Set(meta?.enabledFeatures ?? [])
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
