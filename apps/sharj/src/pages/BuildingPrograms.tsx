import { SideProgramsPanel } from './SideProgramsPanel'
import { useBuildingState, useStore } from '../store/StoreContext'

export function BuildingPrograms() {
  const state = useBuildingState()
  const { platform } = useStore()
  const meta = platform.buildings.find((b) => b.id === state.buildingId)
  const role = state.session!.role
  const manage = role === 'manager'
  return (
    <div className="page">
      <h2>برنامه‌های جانبی</h2>
      <SideProgramsPanel
        role={manage ? 'manager' : role === 'financeManager' ? 'manager' : 'resident'}
        buildingId={state.buildingId}
        complexId={meta?.complexId}
        displayName={state.session!.displayName}
        readOnly={!manage}
      />
    </div>
  )
}
