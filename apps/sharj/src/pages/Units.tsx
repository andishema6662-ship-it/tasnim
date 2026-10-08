import { useState } from 'react'
import { Link } from 'react-router-dom'
import { faNum, toman } from '../lib/format'
import type { UnitVehicle } from '../store/types'
import { useBuildingState, useStore } from '../store/StoreContext'

const VEHICLE_KINDS = ['سواری', 'وانت', 'موتور', 'سایر'] as const

export function Units() {
  const state = useBuildingState()
  const { setUnitVehicles } = useStore()
  const canEdit = state.session.role === 'manager' || state.session.role === 'siteAdmin'
  const [editUnitId, setEditUnitId] = useState<string | null>(null)
  const [draft, setDraft] = useState<UnitVehicle[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const startEdit = (unitId: string, vehicles: UnitVehicle[] | undefined) => {
    setEditUnitId(unitId)
    setDraft((vehicles ?? []).map((v) => ({ ...v })))
  }

  return (
    <div className="page">
      <h2>واحدها</h2>
      <p className="lead">اطلاعات واحد، ساکن، مالک، پارکینگ و خودرو / پلاک.</p>
      <div className="list list-grid-2">
        {state.units.map((u) => (
          <div className="panel" key={u.id}>
            <div className="list-item" style={{ paddingTop: 0 }}>
              <div>
                <div className="title">واحد {u.number}</div>
                <div className="sub">
                  طبقه {faNum(u.floor)} · {faNum(u.areaSqm)} متر · {faNum(u.occupants)} نفر
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

            <div className="unit-vehicles">
              <div className="unit-vehicles__head">
                <strong>خودرو و پلاک</strong>
                {canEdit && editUnitId !== u.id && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => startEdit(u.id, u.vehicles)}
                  >
                    ویرایش خودروها
                  </button>
                )}
              </div>
              {editUnitId === u.id ? (
                <div className="unit-vehicles__form">
                  {draft.map((v, idx) => (
                    <div className="unit-vehicle-row" key={v.id}>
                      <select
                        value={v.kind}
                        onChange={(e) => {
                          const next = [...draft]
                          next[idx] = { ...v, kind: e.target.value }
                          setDraft(next)
                        }}
                      >
                        {VEHICLE_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                        {!VEHICLE_KINDS.includes(v.kind as (typeof VEHICLE_KINDS)[number]) && (
                          <option value={v.kind}>{v.kind}</option>
                        )}
                      </select>
                      <input
                        placeholder="برند / مدل"
                        value={v.brand ?? ''}
                        onChange={(e) => {
                          const next = [...draft]
                          next[idx] = { ...v, brand: e.target.value }
                          setDraft(next)
                        }}
                      />
                      <input
                        placeholder="رنگ"
                        value={v.color ?? ''}
                        onChange={(e) => {
                          const next = [...draft]
                          next[idx] = { ...v, color: e.target.value }
                          setDraft(next)
                        }}
                      />
                      <input
                        className="unit-plate"
                        placeholder="پلاک"
                        value={v.plate}
                        onChange={(e) => {
                          const next = [...draft]
                          next[idx] = { ...v, plate: e.target.value }
                          setDraft(next)
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setDraft(draft.filter((_, i) => i !== idx))}
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                  <div className="grid-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        setDraft([
                          ...draft,
                          {
                            id: `veh-${Date.now()}`,
                            kind: 'سواری',
                            plate: '',
                            brand: '',
                            color: '',
                          },
                        ])
                      }
                    >
                      افزودن خودرو
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        const cleaned = draft.filter((v) => v.plate.trim())
                        setUnitVehicles(u.id, cleaned)
                        setEditUnitId(null)
                        setToast('خودروها ذخیره شد')
                        setTimeout(() => setToast(null), 2200)
                      }}
                    >
                      ذخیره
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setEditUnitId(null)}
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="unit-vehicles__list">
                  {(u.vehicles ?? []).length === 0 && (
                    <li className="sub">خودرویی ثبت نشده.</li>
                  )}
                  {(u.vehicles ?? []).map((v) => (
                    <li key={v.id}>
                      <span className="unit-plate-badge">{v.plate}</span>
                      <span>
                        {v.kind}
                        {v.brand ? ` · ${v.brand}` : ''}
                        {v.color ? ` · ${v.color}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
      <Link className="btn btn-secondary" to="/app/residents" style={{ width: '100%' }}>
        فهرست ساکنین
      </Link>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
