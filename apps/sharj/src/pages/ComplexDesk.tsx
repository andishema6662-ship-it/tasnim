import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GroupedBarChart } from '../components/GroupedBarChart'
import { RequestsDataTable } from '../components/RequestsDataTable'
import { BroadcastBanner } from '../components/BroadcastBanner'
import { catalogOrDefault, hasPaidAddon } from '../lib/features'
import { complexMonthlyCashflow } from '../lib/financeChart'
import { faDate, faNum } from '../lib/format'
import {
  STAFF_SPECIALTIES,
  type ComplexTicket,
  type ComplexTicketStatus,
  type TechnicalPerson,
} from '../store/platformTypes'
import { useStore } from '../store/StoreContext'
import { BroadcastsPanel } from './BroadcastsPanel'
import { ComplexFinance } from './ComplexFinance'
import { ComplexFollowUps } from './ComplexFollowUps'
import { ComplexOwnSubscription } from './ComplexOwnSubscription'
import { ComplexReports } from './ComplexReports'
import { SideProgramsPanel } from './SideProgramsPanel'
import {
  SiteSuggestionsComposer,
  SiteSuggestionsReview,
} from './SiteSuggestionsPanel'

const statusLabel: Record<ComplexTicketStatus, string> = {
  open: 'باز',
  in_progress: 'در جریان',
  resolved: 'حل‌شده',
}

type DeskTab =
  | 'followups'
  | 'tickets'
  | 'staff'
  | 'reports'
  | 'finance'
  | 'subscriptions'
  | 'broadcasts'
  | 'programs'
  | 'proposals'
  | 'addons'

export function ComplexDesk() {
  const {
    platform,
    session,
    logout,
    reloadFromStorage,
    updateComplexTicket,
    upsertStaff,
    removeStaff,
  } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<DeskTab>('followups')
  const [filterBlock, setFilterBlock] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<ComplexTicketStatus | 'all'>('all')
  const [staffForm, setStaffForm] = useState<TechnicalPerson | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [ticketTableStatus, setTicketTableStatus] = useState('all')

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

  const cashflowMonths = useMemo(
    () => (complex ? complexMonthlyCashflow(platform, complex.id, 6) : []),
    [platform, complex],
  )

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
    <div className="app-shell auth wide">
      <div className="page" style={{ paddingTop: 18 }}>
        <header className="topbar">
          <div className="brand-mark">
            <div className="logo">د</div>
            <div>
              <div className="name">شارژبان</div>
              <span className="tag">{complex.name}</span>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div className="meta">{session.displayName}</div>
            <div className="topbar-actions">
              <button
                className="btn-ghost refresh-btn"
                type="button"
                title="بروزرسانی داده"
                aria-label="بروزرسانی داده"
                onClick={() => reloadFromStorage()}
              >
                ↻
              </button>
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
          </div>
        </header>

        <h2>میز مدیر شهرک</h2>
        <p className="lead">
          نیروها، تیکت‌ها، اشتراک بلوک‌ها، پیام مدیر، برنامه‌های جانبی و مالی شهرک.
        </p>

        <BroadcastBanner />

        <div className="chip-row admin-nav">
          {(
            [
              ['followups', 'پیگیری‌ها'],
              ['tickets', 'درخواست‌ها'],
              ['staff', 'نیروهای فنی'],
              ['addons', 'افزونه‌ها'],
              ['subscriptions', 'اشتراک من'],
              ['broadcasts', 'پیام مدیر'],
              ['programs', 'برنامه‌ها'],
              ['proposals', 'پیشنهاد به سایت'],
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

        <div className="panel dash-chart-panel">
          <div className="page-head" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>نمودار میله‌ای — ۶ ماه اخیر شهرک</h3>
            <button type="button" className="btn-ghost" onClick={() => setTab('finance')}>
              مالی
            </button>
          </div>
          <p className="sub" style={{ marginTop: 0 }}>
            تجمیع دریافتی/هزینه بلوک‌ها + دفتر مالی شهرک — برچسب ماه شمسی.
          </p>
          <GroupedBarChart
            months={cashflowMonths}
            seriesALabel="دریافتی / درآمد"
            seriesBLabel="هزینه"
          />
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

        {tab === 'followups' && <ComplexFollowUps complexId={complex.id} />}

        {tab === 'addons' && (
          <div className="panel">
            <h3>افزونه‌های پولی بلوک‌ها</h3>
            <p className="sub">
              برای امکاناتی که هنوز باز نشده‌اند، از مسیر تعرفه → پرداخت فعال کنید.
            </p>
            <div className="list">
              {blocks.flatMap((b) => {
                if (!b) return []
                const catalog = catalogOrDefault(platform.admin.featureCatalog)
                return catalog
                  .filter((e) => e.paidAddon)
                  .map((e) => {
                    const paid = hasPaidAddon(
                      b.id,
                      e.id,
                      platform.admin.subscriptionPayments,
                      e,
                    )
                    return (
                      <div className="list-item" key={`${b.id}-${e.id}`}>
                        <div>
                          <div className="title">
                            {e.label} · {b.name}
                          </div>
                          <div className="sub">{e.hint ?? 'افزونه پولی'}</div>
                        </div>
                        {paid ? (
                          <span className="badge ok">فعال</span>
                        ) : (
                          <Link
                            className="btn btn-copper"
                            to={`/app/activate/${e.id}?buildingId=${encodeURIComponent(b.id)}`}
                          >
                            فعال‌سازی
                          </Link>
                        )}
                      </div>
                    )
                  })
              })}
            </div>
          </div>
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
            <div className="panel">
              <RequestsDataTable
                title="جدول درخواست‌های شهرک"
                rows={tickets.filter((t) =>
                  ticketTableStatus === 'all' ? true : t.status === ticketTableStatus,
                )}
                statusFilters={[
                  { id: 'all', label: 'همه' },
                  { id: 'open', label: 'باز' },
                  { id: 'in_progress', label: 'در جریان' },
                  { id: 'resolved', label: 'حل‌شده' },
                ]}
                statusValue={ticketTableStatus}
                onStatusChange={(id) => {
                  setTicketTableStatus(id)
                  setFilterStatus(id as ComplexTicketStatus | 'all')
                }}
                rowKey={(t) => t.id}
                columns={[
                  {
                    key: 'title',
                    label: 'عنوان',
                    render: (t: ComplexTicket) => t.title,
                    searchText: (t) => `${t.title} ${t.body}`,
                  },
                  {
                    key: 'block',
                    label: 'بلوک',
                    render: (t) =>
                      platform.buildings.find((b) => b.id === t.buildingId)?.name ?? '—',
                    searchText: (t) =>
                      platform.buildings.find((b) => b.id === t.buildingId)?.name ?? '',
                  },
                  {
                    key: 'cat',
                    label: 'دسته',
                    render: (t) => t.category,
                    searchText: (t) => t.category,
                  },
                  {
                    key: 'status',
                    label: 'وضعیت',
                    render: (t) => (
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
                    ),
                    searchText: (t) => statusLabel[t.status],
                  },
                  {
                    key: 'actions',
                    label: 'عملیات',
                    render: (t) => (
                      <div className="grid-actions">
                        <select
                          value={t.assignedPersonId ?? ''}
                          onChange={(e) => {
                            const pid = e.target.value || null
                            updateComplexTicket(t.id, {
                              assignedPersonId: pid,
                              status: pid || t.assignedTeamId ? 'in_progress' : t.status,
                            })
                          }}
                        >
                          <option value="">ارجاع…</option>
                          {staff
                            .filter((s) => s.active || s.id === t.assignedPersonId)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() =>
                            updateComplexTicket(t.id, {
                              status: 'resolved',
                              resolutionNote: 'رفع شد توسط مدیر شهرک',
                            })
                          }
                        >
                          حل
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
            {tickets.map((t) => {
              const b = platform.buildings.find((x) => x.id === t.buildingId)
              const person = staff.find((x) => x.id === t.assignedPersonId)
              return (
                <div className="panel" key={`detail-${t.id}`}>
                  <div className="title">{t.title}</div>
                  <div className="sub">
                    {b?.name} · {t.category} · {faDate(t.updatedAt)}
                    <br />
                    {t.body}
                    {person ? (
                      <>
                        <br />
                        ارجاع: {person.name}
                      </>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {tab === 'subscriptions' && <ComplexOwnSubscription complexId={complex.id} />}

        {tab === 'proposals' && (
          <>
            <SiteSuggestionsComposer
              role="complexManager"
              complexId={complex.id}
              displayName={session.displayName}
            />
            <SiteSuggestionsReview
              filterRole="complexManager"
              complexId={complex.id}
            />
          </>
        )}

        {tab === 'broadcasts' && (
          <BroadcastsPanel
            role="complexManager"
            complexId={complex.id}
            displayName={session.displayName}
          />
        )}

        {tab === 'programs' && (
          <SideProgramsPanel
            role="complexManager"
            complexId={complex.id}
            displayName={session.displayName}
          />
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
