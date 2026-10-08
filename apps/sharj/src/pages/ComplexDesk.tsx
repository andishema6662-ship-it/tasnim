import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { faDate, faNum } from '../lib/format'
import { useStore } from '../store/StoreContext'
import {
  STAFF_SPECIALTIES,
  type ComplexTicketStatus,
  type TechnicalPerson,
} from '../store/platformTypes'
import { ComplexFinance } from './ComplexFinance'
import { ComplexReports } from './ComplexReports'

const statusLabel: Record<ComplexTicketStatus, string> = {
  open: 'باز',
  in_progress: 'در جریان',
  resolved: 'حل‌شده',
}

type DeskTab = 'tickets' | 'staff' | 'reports' | 'finance'

export function ComplexDesk() {
  const {
    platform,
    session,
    logout,
    updateComplexTicket,
    upsertStaff,
    removeStaff,
  } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<DeskTab>('reports')
  const [filterBlock, setFilterBlock] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<ComplexTicketStatus | 'all'>('all')
  const [staffForm, setStaffForm] = useState<TechnicalPerson | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const complex = platform.admin.complexes.find((c) => c.id === session?.complexId)
  const staff = (platform.admin.staff ?? []).filter((s) => s.complexId === complex?.id)

  const tickets = useMemo(() => {
    if (!complex) return []
    return platform.admin.tickets
      .filter((t) => t.complexId === complex.id)
      .filter((t) => (filterBlock === 'all' ? true : t.buildingId === filterBlock))
      .filter((t) => (filterStatus === 'all' ? true : t.status === filterStatus))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  }, [platform.admin.tickets, complex, filterBlock, filterStatus])

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }

  if (!session || session.role !== 'complexManager' || !complex) {
    return (
      <div className="app-shell auth">
        <div className="page" style={{ paddingTop: 40 }}>
          <h2>میز شهرک</h2>
          <p className="lead">با حساب مدیر شهرک وارد شوید (دمو: complex / complex123).</p>
          <Link className="btn btn-primary" to="/login">
            ورود
          </Link>
        </div>
      </div>
    )
  }

  const blocks = complex.blockIds
    .map((id) => platform.buildings.find((b) => b.id === id))
    .filter(Boolean)

  const emptyStaff = (): TechnicalPerson => ({
    id: `stf-${Date.now()}`,
    complexId: complex.id,
    name: '',
    specialty: 'تاسیسات',
    phone: '',
    active: true,
  })

  return (
    <div className="app-shell auth">
      <div className="page" style={{ paddingTop: 18 }}>
        <header className="topbar">
          <div className="brand-mark">
            <div className="logo">د</div>
            <div>
              <div className="name">دیارشارژ</div>
              <span className="tag">{complex.name}</span>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div className="meta">{session.displayName}</div>
            <button
              className="btn-ghost"
              type="button"
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              خروج
            </button>
          </div>
        </header>

        <h2>میز مدیر شهرک</h2>
        <p className="lead">
          نیروها، تیکت‌ها، گزارش رسیدگی و مالی سطح شهرک.
        </p>

        <div className="chip-row admin-nav">
          {(
            [
              ['staff', 'نیروهای فنی'],
              ['tickets', 'تیکت‌ها'],
              ['reports', 'گزارشات'],
              ['finance', 'مالی'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`chip ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="stat-row">
          <div className="stat">
            <span className="label">بلوک‌ها</span>
            <span className="value">{blocks.length}</span>
          </div>
          <div className="stat">
            <span className="label">نیروی فعال</span>
            <span className="value">{staff.filter((s) => s.active).length}</span>
          </div>
        </div>

        {tab === 'staff' && (
          <>
            <div className="panel">
              <h3>ساختمان‌های شهرک</h3>
              <div className="list">
                {blocks.map((b) =>
                  b ? (
                    <div className="list-item" key={b.id}>
                      <div>
                        <div className="title">{b.name}</div>
                        <div className="sub">
                          مدیر بلوک: {b.managerName} · {faNum(b.unitCount)} واحد
                        </div>
                      </div>
                      <span className="badge ok">فعال</span>
                    </div>
                  ) : null,
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-copper"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={() => setStaffForm(emptyStaff())}
            >
              افزودن فرد فنی / پیمانکار
            </button>

            {staffForm && (
              <div className="panel">
                <h3>{staff.some((s) => s.id === staffForm.id) ? 'ویرایش نیرو' : 'نیروی جدید'}</h3>
                <div className="field">
                  <label>نام</label>
                  <input
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    placeholder="مثلاً رضا برق‌کار"
                  />
                </div>
                <div className="field">
                  <label>تخصص / نقش</label>
                  <select
                    value={staffForm.specialty}
                    onChange={(e) => setStaffForm({ ...staffForm, specialty: e.target.value })}
                  >
                    {STAFF_SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>تلفن (اختیاری)</label>
                  <input
                    value={staffForm.phone ?? ''}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="09…"
                  />
                </div>
                <label className="feature-toggle" style={{ marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={staffForm.active}
                    onChange={(e) => setStaffForm({ ...staffForm, active: e.target.checked })}
                  />
                  <span>فعال — قابل ارجاع در تیکت‌ها</span>
                  <span className={`badge ${staffForm.active ? 'ok' : 'soon'}`}>
                    {staffForm.active ? 'فعال' : 'خاموش'}
                  </span>
                </label>
                <div className="grid-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setStaffForm(null)}>
                    انصراف
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!staffForm.name.trim()) return
                      upsertStaff({
                        ...staffForm,
                        name: staffForm.name.trim(),
                        phone: staffForm.phone?.trim() || undefined,
                      })
                      setStaffForm(null)
                      flash('نیروی فنی ذخیره شد')
                    }}
                  >
                    ذخیره
                  </button>
                </div>
              </div>
            )}

            <div className="panel">
              <h3>فهرست افراد فنی</h3>
              <div className="list">
                {staff.map((s) => (
                  <div key={s.id} style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
                    <div className="list-item" style={{ paddingTop: 0 }}>
                      <div>
                        <div className="title">{s.name}</div>
                        <div className="sub">
                          {s.specialty}
                          {s.phone ? ` · ${s.phone}` : ''}
                        </div>
                      </div>
                      <span className={`badge ${s.active ? 'ok' : 'soon'}`}>
                        {s.active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                    <div className="grid-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setStaffForm({ ...s })}
                      >
                        ویرایش
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          if (confirm(`حذف «${s.name}»؟`)) {
                            removeStaff(s.id)
                            flash('حذف شد')
                          }
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
                {staff.length === 0 && <div className="empty">هنوز فردی ثبت نشده.</div>}
              </div>
            </div>

            <div className="panel">
              <h3>تیم‌های فنی (گروهی)</h3>
              <div className="list">
                {platform.admin.teams
                  .filter((t) => t.complexId === complex.id)
                  .map((t) => (
                    <div className="list-item" key={t.id}>
                      <div className="title">{t.name}</div>
                      <div className="sub">{t.specialty}</div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {tab === 'tickets' && (
          <>
            <div className="chip-row">
              <button
                type="button"
                className={`chip ${filterBlock === 'all' ? 'active' : ''}`}
                onClick={() => setFilterBlock('all')}
              >
                همه بلوک‌ها
              </button>
              {blocks.map((b) =>
                b ? (
                  <button
                    key={b.id}
                    type="button"
                    className={`chip ${filterBlock === b.id ? 'active' : ''}`}
                    onClick={() => setFilterBlock(b.id)}
                  >
                    {b.name}
                  </button>
                ) : null,
              )}
            </div>
            <div className="chip-row">
              {(['all', 'open', 'in_progress', 'resolved'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${filterStatus === s ? 'active' : ''}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === 'all' ? 'همه وضعیت‌ها' : statusLabel[s]}
                </button>
              ))}
            </div>

            {tickets.map((t) => {
              const b = platform.buildings.find((x) => x.id === t.buildingId)
              const team = platform.admin.teams.find((x) => x.id === t.assignedTeamId)
              const person = staff.find((x) => x.id === t.assignedPersonId)
              return (
                <div className="panel" key={t.id}>
                  <div className="list-item" style={{ paddingTop: 0 }}>
                    <div>
                      <div className="title">{t.title}</div>
                      <div className="sub">
                        بلوک: {b?.name} · دسته: {t.category}
                        <br />
                        {t.createdBy} · {faDate(t.updatedAt)}
                        <br />
                        {t.body}
                        {person ? (
                          <>
                            <br />
                            ارجاع به فرد: <strong>{person.name}</strong> ({person.specialty}
                            {person.phone ? ` · ${person.phone}` : ''})
                          </>
                        ) : null}
                        {team ? (
                          <>
                            <br />
                            تیم: {team.name} ({team.specialty})
                          </>
                        ) : null}
                        {t.resolutionNote ? (
                          <>
                            <br />
                            نتیجه: {t.resolutionNote}
                          </>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        t.status === 'resolved'
                          ? 'ok'
                          : t.status === 'in_progress'
                            ? 'warn'
                            : 'danger'
                      }`}
                    >
                      {statusLabel[t.status]}
                    </span>
                  </div>
                  <div className="field">
                    <label>دسته</label>
                    <select
                      value={t.category}
                      onChange={(e) => updateComplexTicket(t.id, { category: e.target.value })}
                    >
                      {['آسانسور', 'برق', 'نظافت', 'تاسیسات', 'امنیت', 'سایر'].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>ارجاع به فرد فنی / پیمانکار</label>
                    <select
                      value={t.assignedPersonId ?? ''}
                      onChange={(e) => {
                        const pid = e.target.value || null
                        updateComplexTicket(t.id, {
                          assignedPersonId: pid,
                          status: pid || t.assignedTeamId ? 'in_progress' : t.status,
                        })
                        if (pid) flash('تیکت به فرد ارجاع شد')
                      }}
                    >
                      <option value="">— بدون فرد —</option>
                      {staff
                        .filter((s) => s.active || s.id === t.assignedPersonId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — {s.specialty}
                            {!s.active ? ' (غیرفعال)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>ارجاع به تیم (اختیاری)</label>
                    <select
                      value={t.assignedTeamId ?? ''}
                      onChange={(e) =>
                        updateComplexTicket(t.id, {
                          assignedTeamId: e.target.value || null,
                          status:
                            e.target.value || t.assignedPersonId ? 'in_progress' : t.status,
                        })
                      }
                    >
                      <option value="">— بدون تیم —</option>
                      {platform.admin.teams
                        .filter((tm) => tm.complexId === complex.id)
                        .map((tm) => (
                          <option key={tm.id} value={tm.id}>
                            {tm.name} — {tm.specialty}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => updateComplexTicket(t.id, { status: 'in_progress' })}
                    >
                      در جریان
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        updateComplexTicket(t.id, {
                          status: 'resolved',
                          resolutionNote: t.resolutionNote || 'رفع شد توسط مدیر شهرک',
                        })
                      }
                    >
                      حل‌شده
                    </button>
                  </div>
                </div>
              )
            })}
            {tickets.length === 0 && <div className="empty">تیکتی با این فیلتر نیست.</div>}
          </>
        )}

        {tab === 'reports' && <ComplexReports complexId={complex.id} />}

        {tab === 'finance' && (
          <ComplexFinance complexId={complex.id} displayName={session.displayName} />
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
