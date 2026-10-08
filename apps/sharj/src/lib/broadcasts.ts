import type { ManagerBroadcast, StaffRole } from '../store/platformTypes'
import type { BuildingMeta, Session } from '../store/types'

export function isBroadcastLive(b: ManagerBroadcast, now = Date.now()): boolean {
  if (!b.active) return false
  const start = +new Date(b.startsAt)
  const end = +new Date(b.endsAt)
  return start <= now && now <= end
}

/** Whether the current session should see this broadcast (banner + list). */
export function canSeeBroadcast(
  b: ManagerBroadcast,
  session: Session | null,
  buildings: BuildingMeta[],
): boolean {
  if (!session || !isBroadcastLive(b)) return false
  const role = session.role

  switch (b.audience) {
    case 'complex_managers':
      return role === 'complexManager' || role === 'siteAdmin'
    case 'block_managers': {
      if (role === 'siteAdmin') return true
      if (role === 'complexManager') {
        return !b.complexId || b.complexId === session.complexId
      }
      if (role === 'manager' || role === 'financeManager') {
        if (!session.buildingId) return false
        if (b.buildingId && b.buildingId === session.buildingId) return true
        if (b.complexId) {
          const meta = buildings.find((x) => x.id === session.buildingId)
          return meta?.complexId === b.complexId
        }
      }
      return false
    }
    case 'complex_members': {
      if (role === 'siteAdmin') return true
      if (role === 'complexManager') {
        return !b.complexId || b.complexId === session.complexId
      }
      if (!session.buildingId) return false
      const meta = buildings.find((x) => x.id === session.buildingId)
      return !!meta && meta.complexId === b.complexId
    }
    case 'building_members':
      if (role === 'siteAdmin') return true
      if (role === 'complexManager') {
        const meta = buildings.find((x) => x.id === b.buildingId)
        return !!meta && meta.complexId === session.complexId
      }
      return !!session.buildingId && session.buildingId === b.buildingId
    default:
      return false
  }
}

export function audiencesForRole(role: StaffRole): ManagerBroadcast['audience'][] {
  if (role === 'siteAdmin') {
    return ['complex_managers', 'block_managers', 'complex_members']
  }
  if (role === 'complexManager') {
    return ['block_managers', 'complex_members']
  }
  if (role === 'manager') {
    return ['building_members']
  }
  return []
}

export function resolveProgramStatus(
  startsAt: string,
  endsAt?: string,
  now = Date.now(),
): 'upcoming' | 'active' | 'ended' {
  const start = +new Date(startsAt)
  if (Number.isNaN(start)) return 'upcoming'
  if (now < start) return 'upcoming'
  if (endsAt) {
    const end = +new Date(endsAt)
    if (!Number.isNaN(end) && now > end) return 'ended'
  }
  return 'active'
}
