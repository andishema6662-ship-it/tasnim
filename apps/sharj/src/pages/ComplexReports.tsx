import { useMemo } from 'react'
import { MiniBarChart } from '../components/MiniBarChart'
import { faDate, faNum } from '../lib/format'
import { useStore } from '../store/StoreContext'
import type { ComplexTicketStatus } from '../store/platformTypes'

const statusLabel: Record<ComplexTicketStatus, string> = {
  open: 'باز',
  in_progress: 'در جریان',
  resolved: 'حل‌شده',
}

export function ComplexReports({ complexId }: { complexId: string }) {
  const { platform } = useStore()
  const tickets = platform.admin.tickets.filter((t) => t.complexId === complexId)
  const complex = platform.admin.complexes.find((c) => c.id === complexId)
  const blocks = (complex?.blockIds ?? [])
    .map((id) => platform.buildings.find((b) => b.id === id))
    .filter(Boolean)

  const byStatus = useMemo(() => {
    return (['open', 'in_progress', 'resolved'] as const).map((s) => ({
      label: statusLabel[s],
      value: tickets.filter((t) => t.status === s).length,
      color: s === 'resolved' ? 'var(--teal)' : s === 'in_progress' ? 'var(--copper)' : '#b4534a',
    }))
  }, [tickets])

  const byBlock = useMemo(() => {
    return blocks.map((b) => ({
      label: (b?.name ?? '').slice(0, 12),
      value: tickets.filter((t) => t.buildingId === b!.id).length,
      color: 'var(--teal)',
    }))
  }, [blocks, tickets])

  const referred = tickets.filter((t) => t.assignedPersonId || t.assignedTeamId)
  const resolved = tickets.filter((t) => t.status === 'resolved')
  const recent = [...tickets].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 8)

  return (
    <>
      <div className="stat-row">
        <div className="stat">
          <span className="label">کل درخواست‌ها</span>
          <span className="value">{faNum(tickets.length)}</span>
        </div>
        <div className="stat">
          <span className="label">ارجاع‌شده</span>
          <span className="value">{faNum(referred.length)}</span>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat">
          <span className="label">حل‌شده</span>
          <span className="value">{faNum(resolved.length)}</span>
        </div>
        <div className="stat">
          <span className="label">نرخ رسیدگی</span>
          <span className="value">
            {tickets.length
              ? faNum(Math.round((resolved.length / tickets.length) * 100)) + '٪'
              : '—'}
          </span>
        </div>
      </div>

      <div className="panel">
        <h3>وضعیت رسیدگی</h3>
        <MiniBarChart items={byStatus} />
      </div>

      <div className="panel">
        <h3>درخواست‌ها به تفکیک بلوک</h3>
        <MiniBarChart items={byBlock} />
      </div>

      <div className="panel">
        <h3>خلاصه درخواست‌های بلوک‌ها</h3>
        <div className="list">
          {recent.map((t) => {
            const b = platform.buildings.find((x) => x.id === t.buildingId)
            const person = (platform.admin.staff ?? []).find((s) => s.id === t.assignedPersonId)
            const team = platform.admin.teams.find((x) => x.id === t.assignedTeamId)
            return (
              <div className="list-item" key={t.id}>
                <div>
                  <div className="title">{t.title}</div>
                  <div className="sub">
                    {b?.name} · {t.category} · {faDate(t.updatedAt)}
                    <br />
                    {person
                      ? `ارجاع به ${person.name}`
                      : team
                        ? `تیم ${team.name}`
                        : 'بدون ارجاع'}
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
            )
          })}
          {recent.length === 0 && <div className="empty">درخواستی ثبت نشده.</div>}
        </div>
      </div>
    </>
  )
}
