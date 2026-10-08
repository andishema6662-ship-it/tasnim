import {
  SiteSuggestionsComposer,
  SiteSuggestionsReview,
} from './SiteSuggestionsPanel'
import { useBuildingState, useStore } from '../store/StoreContext'

export function BuildingSiteSuggestions() {
  const state = useBuildingState()
  const { platform } = useStore()
  const meta = platform.buildings.find((b) => b.id === state.buildingId)
  if (state.session?.role !== 'manager') {
    return (
      <div className="page">
        <h2>پیشنهاد به ادمین کل</h2>
        <p className="lead">فقط مدیر بلوک می‌تواند پیشنهاد به ادمین کل ارسال کند.</p>
      </div>
    )
  }
  return (
    <div className="page">
      <h2>پیشنهاد به ادمین کل</h2>
      <SiteSuggestionsComposer
        role="manager"
        buildingId={state.buildingId}
        complexId={meta?.complexId}
        displayName={state.session.displayName}
      />
      <SiteSuggestionsReview
        filterRole="manager"
        buildingId={state.buildingId}
      />
    </div>
  )
}
