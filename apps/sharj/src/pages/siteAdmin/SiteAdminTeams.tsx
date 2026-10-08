import { useState } from 'react'
import { STAFF_SPECIALTIES, type TechnicalTeam } from '../../store/platformTypes'
import { useStore } from '../../store/StoreContext'

export function SiteAdminTeams({ onFlash }: { onFlash: (m: string) => void }) {
  const { platform, upsertTeam, removeTeam } = useStore()
  const [form, setForm] = useState<TechnicalTeam | null>(null)

  const empty = (): TechnicalTeam => ({
    id: `team-${Date.now()}`,
    name: '',
    specialty: STAFF_SPECIALTIES[0],
    phone: '',
    note: '',
    active: true,
  })

  const teams = platform.admin.teams ?? []

  return (
    <>
      <p className="lead">
        تیم‌های فنی سطح سایت (بدون شهرک) یا اختصاص‌یافته به یک شهرک — ایجاد، ویرایش و حذف.
      </p>
      <button
        type="button"
        className="btn btn-copper"
        style={{ width: '100%', marginBottom: 12 }}
        onClick={() => setForm(empty())}
      >
        افزودن تیم فنی
      </button>

      {form && (
        <div className="panel">
          <h3>{form.name ? 'ویرایش تیم' : 'تیم جدید'}</h3>
          <div className="field">
            <label>نام تیم</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>تخصص</label>
            <select
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            >
              {STAFF_SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              {!STAFF_SPECIALTIES.includes(form.specialty as (typeof STAFF_SPECIALTIES)[number]) && (
                <option value={form.specialty}>{form.specialty}</option>
              )}
            </select>
          </div>
          <div className="field">
            <label>محدوده</label>
            <select
              value={form.complexId ?? ''}
              onChange={(e) =>
                setForm({ ...form, complexId: e.target.value || undefined })
              }
            >
              <option value="">سطح سایت (همه املاک)</option>
              {platform.admin.complexes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>تلفن (اختیاری)</label>
            <input
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="field">
            <label>یادداشت</label>
            <textarea
              value={form.note ?? ''}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <label style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            فعال
          </label>
          <div className="grid-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>
              انصراف
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!form.name.trim()) return
                upsertTeam({ ...form, name: form.name.trim() })
                setForm(null)
                onFlash('تیم ذخیره شد')
              }}
            >
              ذخیره
            </button>
          </div>
        </div>
      )}

      <div className="sa-contact-grid">
        {teams.map((t) => {
          const cpx = t.complexId
            ? platform.admin.complexes.find((c) => c.id === t.complexId)?.name
            : 'سطح سایت'
          return (
            <article className="sa-contact-card" key={t.id}>
              <div className="sa-contact-card__body">
                <div className="sa-contact-card__name">{t.name}</div>
                <div className="sa-contact-card__role">{t.specialty}</div>
                <div className="sa-contact-card__meta">
                  {cpx}
                  {t.phone ? ` · ${t.phone}` : ''}
                  {t.note ? (
                    <>
                      <br />
                      {t.note}
                    </>
                  ) : null}
                </div>
              </div>
              <span className={`badge ${t.active !== false ? 'ok' : 'soon'}`}>
                {t.active !== false ? 'فعال' : 'غیرفعال'}
              </span>
              <div className="grid-actions" style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setForm({ ...t, active: t.active !== false })}
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    if (confirm(`حذف تیم «${t.name}»؟`)) {
                      removeTeam(t.id)
                      onFlash('تیم حذف شد')
                    }
                  }}
                >
                  حذف
                </button>
              </div>
            </article>
          )
        })}
      </div>
      {teams.length === 0 && <div className="empty">تیمی ثبت نشده.</div>}
    </>
  )
}
