import { InviteSmsCard } from '../components/InviteSmsCard'
import { useBuildingState } from '../store/StoreContext'

export function Residents() {
  const state = useBuildingState()
  const isManager = state.session.role === 'manager' || state.session.role === 'financeManager'

  return (
    <div className="page">
      <h2>ساکنین</h2>
      <p className="lead">
        {isManager
          ? 'فهرست ساکنین و پیامک دعوت برای نصب سامانه.'
          : 'اطلاعات تماس و نقش در واحد.'}
      </p>
      {isManager && <InviteSmsCard />}
      <div className="panel">
        <h3>فهرست ساکنین</h3>
        <div className="list list-grid-2">
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
          {state.residents.length === 0 && <div className="empty">ساکنی ثبت نشده.</div>}
        </div>
      </div>
    </div>
  )
}
