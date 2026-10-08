import { useMemo, useState } from 'react'
import { faDate, faNum } from '../lib/format'
import type { ComplexTicket, ComplexTicketStatus } from '../store/platformTypes'
import { useStore } from '../store/StoreContext'
import { RequestsDataTable } from '../components/RequestsDataTable'

const statusLabel: Record<ComplexTicketStatus, string> = {
  open: 'باز',
  in_progress: 'در جریان',
  resolved: 'حل‌شده',
}

/**
 * Complex manager follow-up / tracking board — jobSearch-inspired filters + cards.
 */
export function ComplexFollowUps({ complexId }: { complexId: string }) {
  const { platform, updateComplexTicket } = useStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<ComplexTicketStatus | 'all'>('all')
  const [blockId, setBlockId] = useState('all')
  const [category, setCategory] = useState('all')
  const [view, setView] = useState<'board' | 'table'>('board')

  const complex = platform.admin.complexes.find((c) => c.id === complexId)
  const blocks = (complex?.blockIds ?? [])
    .map((id) => platform.buildings.find((b) => b.id === id))
    .filter(Boolean)

  const tickets = useMemo(() => {
    return platform.admin.tickets
      .filter((t) => t.complexId === complexId)
      .filter((t) => (status === 'all' ? true : t.status === status))
      .filter((t) => (blockId === 'all' ? true : t.buildingId === blockId))
      .filter((t) => (category === 'all' ? true : t.category === category))
      .filter((t) => {
        if (!q.trim()) return true
        const hay = `${t.title} ${t.body} ${t.category} ${t.createdBy}`.toLowerCase()
        return hay.includes(q.trim().toLowerCase())
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  }, [platform.admin.tickets, complexId, status, blockId, category, q])

  const categories = useMemo(() => {
    const set = new Set(platform.admin.tickets.filter((t) => t.complexId === complexId).map((t) => t.category))
    return [...set]
  }, [platform.admin.tickets, complexId])

  const counts = useMemo(() => {
    const all = platform.admin.tickets.filter((t) => t.complexId === complexId)
    return {
      open: all.filter((t) => t.status === 'open').length,
      in_progress: all.filter((t) => t.status === 'in_progress').length,
      resolved: all.filter((t) => t.status === 'resolved').length,
    }
  }, [platform.admin.tickets, complexId])

  const columns = [
    {
      key: 'title',
      label: 'عنوان',
      render: (t: ComplexTicket) => t.title,
      searchText: (t: ComplexTicket) => t.title,
    },
    {
      key: 'block',
      label: 'بلوک',
      render: (t: ComplexTicket) =>
        platform.buildings.find((b) => b.id === t.buildingId)?.name ?? '—',
      searchText: (t: ComplexTicket) =>
        platform.buildings.find((b) => b.id === t.buildingId)?.name ?? '',
    },
    {
      key: 'cat',
      label: 'دسته',
      render: (t: ComplexTicket) => t.category,
      searchText: (t: ComplexTicket) => t.category,
    },
    {
      key: 'status',
      label: 'وضعیت',
      render: (t: ComplexTicket) => (
        <span
          className={`badge ${
            t.status === 'resolved' ? 'ok' : t.status === 'in_progress' ? 'warn' : 'danger'
          }`}
        >
          {statusLabel[t.status]}
        </span>
      ),
      searchText: (t: ComplexTicket) => statusLabel[t.status],
    },
    {
      key: 'at',
      label: 'بروزرسانی',
      render: (t: ComplexTicket) => faDate(t.updatedAt),
      searchText: (t: ComplexTicket) => t.updatedAt,
    },
  ]

  return (
    <div className="job-track">
      <div className="job-track__hero">
        <div>
          <p className="sa-hero__eyebrow">پیگیری‌های شهرک</p>
          <h3 className="sa-hero__title">تابلوی پیگیری تیکت‌ها و ارجاع‌ها</h3>
          <p className="sa-hero__lead">
            جستجو، فیلتر وضعیت/بلوک/دسته — نمای کارت یا جدول درخواست‌ها.
          </p>
        </div>
        <div className="job-track__stats">
          <div>
            <strong>{faNum(counts.open)}</strong>
            <span>باز</span>
          </div>
          <div>
            <strong>{faNum(counts.in_progress)}</strong>
            <span>در جریان</span>
          </div>
          <div>
            <strong>{faNum(counts.resolved)}</strong>
            <span>حل‌شده</span>
          </div>
        </div>
      </div>

      <div className="job-track__filters">
        <input
          className="dt-search"
          placeholder="جستجوی عنوان، شرح، دسته‌بندی…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="dt-chips">
          {(
            [
              ['all', 'همه'],
              ['open', 'باز'],
              ['in_progress', 'در جریان'],
              ['resolved', 'حل‌شده'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`sa-chip ${status === id ? 'active' : ''}`}
              onClick={() => setStatus(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="dt-chips">
          <button
            type="button"
            className={`sa-chip ${blockId === 'all' ? 'active' : ''}`}
            onClick={() => setBlockId('all')}
          >
            همه بلوک‌ها
          </button>
          {blocks.map((b) =>
            b ? (
              <button
                key={b.id}
                type="button"
                className={`sa-chip ${blockId === b.id ? 'active' : ''}`}
                onClick={() => setBlockId(b.id)}
              >
                {b.name}
              </button>
            ) : null,
          )}
        </div>
        <div className="dt-chips">
          <button
            type="button"
            className={`sa-chip ${category === 'all' ? 'active' : ''}`}
            onClick={() => setCategory('all')}
          >
            همه دسته‌ها
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`sa-chip ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="dt-chips">
          <button
            type="button"
            className={`sa-chip ${view === 'board' ? 'active' : ''}`}
            onClick={() => setView('board')}
          >
            کارت‌ها
          </button>
          <button
            type="button"
            className={`sa-chip ${view === 'table' ? 'active' : ''}`}
            onClick={() => setView('table')}
          >
            جدول درخواست‌ها
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="panel">
          <RequestsDataTable
            title="لیست درخواست‌ها"
            rows={tickets}
            columns={columns}
            rowKey={(t) => t.id}
            emptyText="درخواستی با این فیلتر نیست."
          />
        </div>
      ) : (
        <div className="job-track__grid">
          {tickets.map((t) => {
            const b = platform.buildings.find((x) => x.id === t.buildingId)
            const person = (platform.admin.staff ?? []).find((s) => s.id === t.assignedPersonId)
            return (
              <article className="job-card" key={t.id}>
                <div className="job-card__top">
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
                  <span className="job-card__cat">{t.category}</span>
                </div>
                <h4 className="job-card__title">{t.title}</h4>
                <p className="job-card__body">{t.body}</p>
                <div className="job-card__meta">
                  {b?.name} · {t.createdBy}
                  <br />
                  {faDate(t.updatedAt)}
                  {person ? ` · ارجاع: ${person.name}` : ''}
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
                        resolutionNote: t.resolutionNote || 'پیگیری و رفع شد',
                      })
                    }
                  >
                    حل‌شده
                  </button>
                </div>
              </article>
            )
          })}
          {tickets.length === 0 && <div className="empty">موردی برای پیگیری نیست.</div>}
        </div>
      )}
    </div>
  )
}
