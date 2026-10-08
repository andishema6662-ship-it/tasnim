import { Link } from 'react-router-dom'
import { toman } from '../lib/format'
import { useBuildingState } from '../store/StoreContext'

export function Units() {
  const state = useBuildingState()
  return (
    <div className="page">
      <h2>واحدها</h2>
      <p className="lead">اطلاعات واحد، ساکن، مالک و پارکینگ.</p>
      <div className="list">
        {state.units.map((u) => (
          <div className="panel" key={u.id}>
            <div className="list-item" style={{ paddingTop: 0 }}>
              <div>
                <div className="title">واحد {u.number}</div>
                <div className="sub">
                  طبقه {u.floor} · {u.areaSqm} متر · {u.occupants} نفر
                  <br />
                  مالک: {u.ownerName}
                  <br />
                  ساکن: {u.residentName}
                  <br />
                  پارکینگ: {u.parkingSpot ?? '—'}
                </div>
              </div>
              <span className={`badge ${u.balance < 0 ? 'danger' : u.balance > 0 ? 'ok' : ''}`}>
                {u.balance < 0 ? 'بدهکار' : u.balance > 0 ? 'بستانکار' : 'تسویه'}
              </span>
            </div>
            <div className="sub" style={{ marginTop: 6 }}>
              مانده: {toman(u.balance)}
            </div>
          </div>
        ))}
      </div>
      <div className="panel">
        <h3>مشاعات و تردد</h3>
        <p className="sub" style={{ margin: 0 }}>
          مدیریت مشاعات و ثبت ورود/خروج — اسکلت آماده؛ جزئیات کاربری به‌زودی.
        </p>
        <span className="badge soon">به‌زودی</span>
      </div>
      <Link className="btn btn-secondary" to="/app/residents" style={{ width: '100%' }}>
        فهرست ساکنین
      </Link>
    </div>
  )
}
