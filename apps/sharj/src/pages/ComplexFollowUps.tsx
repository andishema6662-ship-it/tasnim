import { useMemo, useState } from 'react'
import { RequestsDataTable } from '../components/RequestsDataTable'
import { faDate, faNum } from '../lib/format'
import type { ComplexTicket, ComplexTicketStatus } from '../store/platformTypes'
import { useStore } from '../store/StoreContext'

const statusLabel: Record<ComplexTicketStatus, string> = {
  open: 'باز',
  in_progress: 'در جریان',
  resolved: 'حل‌شده',
}

/**
 * Complex manager follow-ups — layout adapted from HexaDash jobSearch
 * (search bar + filter sidebar + result cards / table). Original Taskose CSS.
 */
export function ComplexFollowUps({ complexId }: { complexId: string }) {
  const { platform, updateComplexTicket } = useStore()
  const [q, setQ] = useState('')
  const [locationQ, setLocationQ] = useState('')
  const [status, setStatus] = useState<ComplexTicketStatus | 'all'>('all')
  const [blockId, setBlockId] = useState('all')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [view, setView] = useState<'board' | 'table'>('board')

  const complex = platform.admin.complexes.find((c) => c.id === complexId)
  const blocks = (complex?.blockIds ?? [])
    .map((id) => platform.buildings.find((b) => b.id === id))
    .filter(Boolean)

  const allTickets = useMemo(
    () => platform.admin.tickets.filter((t) => t.complexId === complexId),
    [platform.admin.tickets, complexId],
  )

  const tickets = useMemo(() => {
    const list = allTickets
      .filter((t) => (status === 'all' ? true : t.status === status))
      .filter((t) => (blockId === 'all' ? true : t.buildingId === blockId))
      .filter((t) => (category === 'all' ? true : t.category === category))
      .filter((t) => {
        if (!q.trim()) return true
        const hay = `${t.title} ${t.body} ${t.category} ${t.createdBy}`.toLowerCase()
        return hay.includes(q.trim().toLowerCase())
      })
      .filter((t) => {
        if (!locationQ.trim()) return true
        const b = platform.buildings.find((x) => x.id === t.buildingId)
        return (b?.name ?? '').toLowerCase().includes(locationQ.trim().toLowerCase())
      })
      .sort((a, b) =>
        sort === 'newest'
          ? +new Date(b.updatedAt) - +new Date(a.updatedAt)
          : +new Date(a.updatedAt) - +new Date(b.updatedAt),
      )
    return list
  }, [allTickets, status, blockId, category, q, locationQ, sort, platform.buildings])

  const categories = useMemo(() => {
    return [...new Set(allTickets.map((t) => t.category))]
  }, [allTickets])

  const counts = useMemo(
    () => ({
      open: allTickets.filter((t) => t.status === 'open').length,
      in_progress: allTickets.filter((t) => t.status === 'in_progress').length,
      resolved: allTickets.filter((t) => t.status === 'resolved').length,
    }),
    [allTickets],
  )

  const columns = [
    {
      key: 'id',
      label: 'شناسه',
      render: (t: ComplexTicket) => (
        <span className="udt-id">#{t.id.slice(-4)}</span>
      ),
      searchText: (t: ComplexTicket) => t.id,
    },
    {
      key: 'title',
      label: 'عنوان',
      render: (t: ComplexTicket) => (
        <div className="udt-title-cell">
          <strong>{t.title}</strong>
          <span>{t.createdBy}</span>
        </div>
      ),
      searchText: (t: ComplexTicket) => `${t.title} ${t.body}`,
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
        <span className={`udt-status udt-status--${t.status}`}>
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
    <div className="js-page">
      <div className="js-breadcrumb">
        <h3 className="js-breadcrumb__title">پیگیری‌ها</h3>
        <div className="js-breadcrumb__trail">
          <span>میز شهرک</span>
          <span>/</span>
          <span className="active">پیگیری درخواست‌ها</span>
        </div>
      </div>

      {/* Dual search bar — keyword + location */}
      <div className="js-search-bar">
        <div className="js-search-bar__field">
          <label>جستجو</label>
          <input
            placeholder="عنوان یا شرح درخواست…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="js-search-bar__field">
          <label>بلوک / محل</label>
          <input
            placeholder="نام بلوک…"
            value={locationQ}
            onChange={(e) => setLocationQ(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary js-search-bar__btn"
          onClick={() => {
            /* filters are live; button matches template CTA */
          }}
        >
          جستجو
        </button>
      </div>

      <div className="js-layout">
        {/* Filter sidebar */}
        <aside className="js-filters" aria-label="فیلترها">
          <div className="js-filters__head">فیلترها</div>

          <section className="js-filter-widget">
            <h6>وضعیت</h6>
            <ul className="js-check-list">
              {(
                [
                  ['all', 'همه', allTickets.length],
                  ['open', 'باز', counts.open],
                  ['in_progress', 'در جریان', counts.in_progress],
                  ['resolved', 'حل‌شده', counts.resolved],
                ] as const
              ).map(([id, label, n]) => (
                <li key={id}>
                  <label className="js-check">
                    <input
                      type="radio"
                      name="js-status"
                      checked={status === id}
                      onChange={() => setStatus(id)}
                    />
                    <span>
                      {label} <em>({faNum(n)})</em>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="js-filter-widget">
            <h6>بلوک</h6>
            <ul className="js-check-list">
              <li>
                <label className="js-check">
                  <input
                    type="radio"
                    name="js-block"
                    checked={blockId === 'all'}
                    onChange={() => setBlockId('all')}
                  />
                  <span>همه بلوک‌ها</span>
                </label>
              </li>
              {blocks.map((b) =>
                b ? (
                  <li key={b.id}>
                    <label className="js-check">
                      <input
                        type="radio"
                        name="js-block"
                        checked={blockId === b.id}
                        onChange={() => setBlockId(b.id)}
                      />
                      <span>{b.name}</span>
                    </label>
                  </li>
                ) : null,
              )}
            </ul>
          </section>

          <section className="js-filter-widget">
            <h6>نوع / دسته</h6>
            <ul className="js-check-list">
              <li>
                <label className="js-check">
                  <input
                    type="radio"
                    name="js-cat"
                    checked={category === 'all'}
                    onChange={() => setCategory('all')}
                  />
                  <span>همه</span>
                </label>
              </li>
              {categories.map((c) => (
                <li key={c}>
                  <label className="js-check">
                    <input
                      type="radio"
                      name="js-cat"
                      checked={category === c}
                      onChange={() => setCategory(c)}
                    />
                    <span>{c}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        {/* Results */}
        <div className="js-results">
          <div className="js-results-top">
            <span className="js-results-count">
              نمایش <strong>{faNum(Math.min(1, tickets.length))}</strong>
              {tickets.length > 0 ? (
                <>
                  –<strong>{faNum(tickets.length)}</strong>
                </>
              ) : null}{' '}
              از <strong>{faNum(allTickets.length)}</strong> نتیجه
            </span>
            <div className="js-results-tools">
              <label className="js-sort">
                مرتب‌سازی:
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
                >
                  <option value="newest">آخرین</option>
                  <option value="oldest">قدیمی</option>
                </select>
              </label>
              <div className="js-view-toggle" role="group" aria-label="نمای نتایج">
                <button
                  type="button"
                  className={view === 'board' ? 'active' : ''}
                  onClick={() => setView('board')}
                  title="کارت"
                >
                  ⊞
                </button>
                <button
                  type="button"
                  className={view === 'table' ? 'active' : ''}
                  onClick={() => setView('table')}
                  title="جدول"
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          {view === 'table' ? (
            <div className="js-table-panel">
              <RequestsDataTable
                title="جدول درخواست‌ها"
                rows={tickets}
                columns={columns}
                rowKey={(t) => t.id}
                emptyText="درخواستی با این فیلتر نیست."
              />
            </div>
          ) : (
            <div className="js-card-grid">
              {tickets.map((t) => {
                const b = platform.buildings.find((x) => x.id === t.buildingId)
                const person = (platform.admin.staff ?? []).find(
                  (s) => s.id === t.assignedPersonId,
                )
                const initial = (t.title.trim()[0] || '؟').toUpperCase()
                return (
                  <article className="js-job-card" key={t.id}>
                    <div className="js-job-card__main">
                      <div className="js-job-card__identity">
                        <div className="js-job-card__avatar" aria-hidden>
                          {initial}
                        </div>
                        <div>
                          <h4 className="js-job-card__title">{t.title}</h4>
                          <span className="js-job-card__loc">
                            {b?.name ?? 'بلوک'} · {t.createdBy}
                          </span>
                        </div>
                      </div>
                      <div className="js-job-card__meta">
                        <div>
                          <h6>بروزرسانی</h6>
                          <span>{faDate(t.updatedAt)}</span>
                        </div>
                        <div>
                          <h6>نوع</h6>
                          <span>{t.category}</span>
                        </div>
                        <div>
                          <h6>وضعیت</h6>
                          <span className={`udt-status udt-status--${t.status}`}>
                            {statusLabel[t.status]}
                          </span>
                        </div>
                        {person && (
                          <div>
                            <h6>ارجاع</h6>
                            <span>{person.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="js-job-card__actions">
                      <button
                        type="button"
                        className="btn btn-outline"
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
              {tickets.length === 0 && (
                <div className="empty js-empty">موردی برای پیگیری نیست.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
