import { useStore } from '../store/StoreContext'

export function Residents() {
  const { state } = useStore()
  return (
    <div className="page">
      <h2>ساکنین</h2>
      <p className="lead">اطلاعات تماس و نقش در واحد.</p>
      <div className="panel">
        <div className="list">
          {state.residents.map((r) => {
            const unit = state.units.find((u) => u.id === r.unitId)
            return (
              <div className="list-item" key={r.id}>
                <div>
                  <div className="title">{r.name}</div>
                  <div className="sub">
                    واحد {unit?.number} · {r.roleInUnit === 'owner' ? 'مالک' : 'ساکن'} · {r.phone}
                  </div>
                </div>
                <span className="badge">{r.roleInUnit === 'owner' ? 'مالک' : 'ساکن'}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
