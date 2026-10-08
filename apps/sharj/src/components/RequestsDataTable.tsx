import { useMemo, useState, type ReactNode } from 'react'
import { faNum } from '../lib/format'

export interface DataColumn<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  /** Included in text search */
  searchText?: (row: T) => string
}

type Props<T> = {
  title?: string
  rows: T[]
  columns: DataColumn<T>[]
  rowKey: (row: T) => string
  emptyText?: string
  /** Optional status chips */
  statusFilters?: { id: string; label: string }[]
  statusValue?: string
  onStatusChange?: (id: string) => void
  pageSize?: number
  toolbar?: ReactNode
}

/**
 * Datatable-inspired requests list (search, status chips, paging).
 * Original Taskose styling — not a proprietary CSS clone.
 */
export function RequestsDataTable<T>({
  title,
  rows,
  columns,
  rowKey,
  emptyText = 'موردی نیست.',
  statusFilters,
  statusValue = 'all',
  onStatusChange,
  pageSize = 8,
  toolbar,
}: Props<T>) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) =>
      columns.some((c) => {
        const text = c.searchText?.(row) ?? String(c.render(row) ?? '')
        return text.toLowerCase().includes(needle)
      }),
    )
  }, [rows, q, columns])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)

  return (
    <div className="dt-wrap">
      {(title || toolbar) && (
        <div className="dt-head">
          {title ? <h3 className="dt-title">{title}</h3> : <span />}
          {toolbar}
        </div>
      )}
      <div className="dt-toolbar">
        <input
          className="dt-search"
          placeholder="جستجو در درخواست‌ها…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(0)
          }}
        />
        {statusFilters && statusFilters.length > 0 && (
          <div className="dt-chips">
            {statusFilters.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`sa-chip ${statusValue === f.id ? 'active' : ''}`}
                onClick={() => {
                  onStatusChange?.(f.id)
                  setPage(0)
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="dt-meta">
        {faNum(filtered.length)} مورد
        {q.trim() ? ` · فیلتر «${q.trim()}»` : ''}
      </div>
      <div className="dt-scroll">
        <table className="dt-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {slice.length === 0 && <div className="empty dt-empty">{emptyText}</div>}
      </div>
      {pageCount > 1 && (
        <div className="dt-pager">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            قبلی
          </button>
          <span>
            صفحه {faNum(safePage + 1)} از {faNum(pageCount)}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  )
}
