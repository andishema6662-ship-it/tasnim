import { useMemo, useState } from 'react'
import { faNum, toman } from '../../lib/format'
import { qarzStatusLabel } from '../../lib/qarz'
import type { QarzApprovalThreshold } from '../../store/types'
import { useStore } from '../../store/StoreContext'

export function SiteAdminQarz({ onFlash }: { onFlash: (m: string) => void }) {
  const { platform, createSiteQarzAssignment } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('صندوق قرض‌الحسنه مرکزی')
  const [totalAmount, setTotalAmount] = useState(30_000_000)
  const [periodMonths, setPeriodMonths] = useState(12)
  const [threshold, setThreshold] = useState<QarzApprovalThreshold>('majority')
  const [target, setTarget] = useState<'block' | 'complex'>('block')
  const [buildingId, setBuildingId] = useState(platform.buildings[0]?.id ?? '')
  const [complexId, setComplexId] = useState(platform.admin.complexes[0]?.id ?? '')
  const [note, setNote] = useState('')
  const [submitForApproval, setSubmitForApproval] = useState(false)

  const allQarz = useMemo(() => {
    return platform.buildings.flatMap((b) =>
      (platform.byId[b.id]?.qarzFunds ?? []).map((q) => ({
        ...q,
        buildingName: b.name,
        buildingId: b.id,
      })),
    )
  }, [platform])

  return (
    <>
      <p className="lead">
        ادمین سایت صندوق را متمرکز می‌سازد و به یک شهرک یا یک بلوک اختصاص می‌دهد.
      </p>
      <button
        type="button"
        className="btn btn-copper"
        style={{ width: '100%', marginBottom: 12 }}
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? 'بستن فرم' : 'ایجاد صندوق مرکزی'}
      </button>

      {showForm && (
        <div className="panel">
          <h3>ایجاد و اختصاص</h3>
          <div className="field">
            <label>عنوان</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid-actions">
            <div className="field">
              <label>مبلغ کل (تومان)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>دوره (ماه)</label>
              <input
                type="number"
                value={periodMonths}
                onChange={(e) => setPeriodMonths(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="field">
            <label>آستانه تأیید اعضا</label>
            <select
              value={threshold}
              onChange={(e) => setThreshold(e.target.value as QarzApprovalThreshold)}
            >
              <option value="majority">اکثریت</option>
              <option value="unanimous">اتفاق آرا</option>
            </select>
          </div>
          <div className="field">
            <label>اختصاص به</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as 'block' | 'complex')}
            >
              <option value="block">یک بلوک / ساختمان / برج</option>
              <option value="complex">یک شهرک (همه بلوک‌ها)</option>
            </select>
          </div>
          {target === 'block' ? (
            <div className="field">
              <label>بلوک / ساختمان</label>
              <select value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
                {platform.buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field">
              <label>شهرک</label>
              <select value={complexId} onChange={(e) => setComplexId(e.target.value)}>
                {platform.admin.complexes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label>یادداشت</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <label style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={submitForApproval}
              onChange={(e) => setSubmitForApproval(e.target.checked)}
            />
            ارسال برای تأیید اعضا
          </label>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => {
              const n = createSiteQarzAssignment({
                title,
                totalAmount,
                periodMonths,
                approvalThreshold: threshold,
                note,
                target,
                buildingId,
                complexId,
                submitForApproval,
              })
              if (n > 0) {
                setShowForm(false)
                onFlash(`صندوق در ${faNum(n)} محل ایجاد شد`)
              } else {
                onFlash('ایجاد ناموفق — هدف یا واحدها را بررسی کنید')
              }
            }}
          >
            ایجاد و اختصاص
          </button>
        </div>
      )}

      <div className="panel">
        <h3>همه صندوق‌ها</h3>
        <div className="list">
          {allQarz.map((q) => (
            <div className="list-item" key={`${q.buildingId}-${q.id}`}>
              <div>
                <div className="title">{q.title}</div>
                <div className="sub">
                  {q.buildingName} · {toman(q.totalAmount)} · {faNum(q.periodMonths)} ماه
                  {q.createdBySiteAdmin ? ' · ایجاد مرکزی ادمین' : ''}
                  {q.assignedComplexId
                    ? ` · شهرک ${
                        platform.admin.complexes.find((c) => c.id === q.assignedComplexId)
                          ?.name ?? q.assignedComplexId
                      }`
                    : ''}
                </div>
              </div>
              <span className="badge">{qarzStatusLabel[q.status]}</span>
            </div>
          ))}
          {allQarz.length === 0 && <div className="empty">صندوقی نیست.</div>}
        </div>
      </div>
    </>
  )
}
