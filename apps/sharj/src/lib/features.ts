import {
  DEFAULT_FEATURE_CATALOG,
  isSubPaid,
  type FeatureCatalogEntry,
  type FeatureModuleId,
  type SubPeriodMonths,
  type SubscriptionPayment,
} from '../store/platformTypes'
import type { BuildingMeta } from '../store/types'

export function catalogOrDefault(
  catalog?: FeatureCatalogEntry[] | null,
): FeatureCatalogEntry[] {
  if (Array.isArray(catalog) && catalog.length > 0) return catalog
  return DEFAULT_FEATURE_CATALOG.map((e) => ({ ...e }))
}

/** Features applied when a new building/block/tower is created (excludes unpaid add-ons). */
export function defaultFeaturesFromCatalog(
  catalog?: FeatureCatalogEntry[] | null,
): FeatureModuleId[] {
  return catalogOrDefault(catalog)
    .filter((e) => e.defaultEnabled && !e.paidAddon)
    .map((e) => e.id)
}

export function featureEntry(
  id: FeatureModuleId,
  catalog?: FeatureCatalogEntry[] | null,
): FeatureCatalogEntry | undefined {
  return catalogOrDefault(catalog).find((e) => e.id === id)
}

export function addonPrice(
  entry: FeatureCatalogEntry,
  months: SubPeriodMonths = 12,
): number {
  if (!entry.paidAddon) return 0
  if (entry.pricingMode === 'one_time') return entry.oneTimePrice ?? 0
  if (months === 3) return entry.price3 ?? 0
  if (months === 6) return entry.price6 ?? 0
  return entry.price12 ?? entry.price6 ?? entry.price3 ?? 0
}

/** Approved / demo add-on payments for a building+module (period not expired when months set). */
export function hasPaidAddon(
  buildingId: string,
  featureId: FeatureModuleId,
  payments: SubscriptionPayment[],
  entry?: FeatureCatalogEntry,
): boolean {
  const paid = payments.filter(
    (p) =>
      p.buildingId === buildingId &&
      p.addonFeatureId === featureId &&
      isSubPaid(p.status),
  )
  if (paid.length === 0) return false
  if (!entry || entry.pricingMode !== 'period') return true
  const now = Date.now()
  return paid.some((p) => {
    const start = +new Date(p.reviewedAt ?? p.createdAt)
    const ms = (p.months || 12) * 30 * 86400000
    return start + ms >= now
  })
}

export function pendingAddon(
  buildingId: string,
  featureId: FeatureModuleId,
  payments: SubscriptionPayment[],
): SubscriptionPayment | undefined {
  return payments.find(
    (p) =>
      p.buildingId === buildingId &&
      p.addonFeatureId === featureId &&
      p.status === 'pending',
  )
}

/**
 * Effective gate: listed in enabledFeatures AND (not a paid add-on OR paid/approved).
 * Toggle alone cannot activate a paid module.
 */
export function isFeatureEffectivelyEnabled(
  meta: BuildingMeta | undefined,
  featureId: FeatureModuleId,
  catalog: FeatureCatalogEntry[] | null | undefined,
  payments: SubscriptionPayment[],
): boolean {
  if (!meta) return true
  if (!meta.enabledFeatures.includes(featureId)) return false
  const entry = featureEntry(featureId, catalog)
  if (!entry?.paidAddon) return true
  return hasPaidAddon(meta.id, featureId, payments, entry)
}

export function effectiveFeatureSet(
  meta: BuildingMeta | undefined,
  catalog: FeatureCatalogEntry[] | null | undefined,
  payments: SubscriptionPayment[],
): Set<FeatureModuleId> {
  const cat = catalogOrDefault(catalog)
  const set = new Set<FeatureModuleId>()
  if (!meta) {
    for (const e of cat) set.add(e.id)
    return set
  }
  for (const id of meta.enabledFeatures) {
    if (isFeatureEffectivelyEnabled(meta, id, cat, payments)) set.add(id)
  }
  return set
}
