import { BroadcastsPanel } from './BroadcastsPanel'
import { useBuildingState, useStore } from '../store/StoreContext'

export function BuildingBroadcasts() {
  const state = useBuildingState()
  const { platform } = useStore()
  const meta = platform.buildings.find((b) => b.id === state.buildingId)
  const role = state.session?.role
  if (role !== 'manager') {
    return (
      <div className="page">
        <h2>پیام مدیر</h2>
        <p className="lead">فقط مدیر بلوک می‌تواند پیام برای اعضای ساختمان ارسال کند.</p>
      </div>
    )
  }
  return (
    <div className="page">
      <h2>پیام مدیر بلوک</h2>
      <BroadcastsPanel
        role="manager"
        buildingId={state.buildingId}
        complexId={meta?.complexId}
        displayName={state.session!.displayName}
      />
    </div>
  )
}
