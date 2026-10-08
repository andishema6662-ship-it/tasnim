import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { faDate, faNum } from '../lib/format'
import { useStore } from '../store/StoreContext'
import type { ComplexTicketStatus } from '../store/platformTypes'

const statusLabel: Record<ComplexTicketStatus, string> = {
  open: 'باز',
  in_progress: 'در جریان',
  resolved: 'حل‌شده',
}

export function ComplexDesk() {
  const { platform, session, logout, updateComplexTicket } = useStore()
  const navigate = useNavigate()
  const [filterBlock, setFilterBlock] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<ComplexTicketStatus | 'all'>('all')

  const complex = platform.admin.complexes.find((c) => c.id === session?.complexId)

  const tickets = useMemo(() => {
    if (!complex) return []
    return platform.admin.tickets
      .filter((t) => t.complexId === complex.id)
      .filter((t) => (filterBlock === 'all' ? true : t.buildingId === filterBlock))
      .filter((t) => (filterStatus === 'all' ? true : t.status === filterStatus))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  }, [platform.admin.tickets, complex, filterBlock, filterStatus])

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
          بلوک‌های شهرک، تیم‌های فنی و تیکت‌ها — بدون دسترسی به پنل کل سایت.
        </p>

        <div className="stat-row">
          <div className="stat">
            <span className="label">بلوک‌ها</span>
            <span className="value">{blocks.length}</span>
          </div>
          <div className="stat">
            <span className="label">تیکت باز</span>
            <span className="value">
              {tickets.filter((t) => t.status === 'open').length}
            </span>
          </div>
        </div>

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

        <div className="panel">
          <h3>تیم‌های فنی</h3>
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

        <h3 style={{ marginTop: 8 }}>تیکت‌های فنی</h3>

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
                    t.status === 'resolved' ? 'ok' : t.status === 'in_progress' ? 'warn' : 'danger'
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
                <label>ارجاع به تیم</label>
                <select
                  value={t.assignedTeamId ?? ''}
                  onChange={(e) =>
                    updateComplexTicket(t.id, {
                      assignedTeamId: e.target.value || undefined,
                      status: e.target.value ? 'in_progress' : t.status,
                    })
                  }
                >
                  <option value="">— انتخاب تیم —</option>
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
      </div>
    </div>
  )
}
