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
  /** Optional status chips / select options */
  statusFilters?: { id: string; label: string }[]
  statusValue?: string
  onStatusChange?: (id: string) => void
  pageSize?: number
  toolbar?: ReactNode
}

/**
 * Request list datatable — structure adapted from HexaDash datatable
 * (support-form toolbar + borderless userDatatable). Original Taskose CSS.
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
    <div className="udt">
      <div className="udt-breadcrumb">
        <div className="udt-breadcrumb__title-wrap">
          {title ? <h3 className="udt-breadcrumb__title">{title}</h3> : <span />}
          {toolbar}
        </div>
      </div>

      <div className="udt-support-form">
        <div className="udt-support-form__inputs">
          {statusFilters && statusFilters.length > 0 && (
            <label className="udt-field">
              <span>وضعیت:</span>
              <select
                value={statusValue}
                onChange={(e) => {
                  onStatusChange?.(e.target.value)
                  setPage(0)
                }}
              >
                {statusFilters.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            className="udt-support-form__go"
            onClick={() => setPage(0)}
          >
            جستجو
          </button>
        </div>
        <div className="udt-support-form__search">
          <input
            placeholder="جستجو در درخواست‌ها…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(0)
            }}
          />
        </div>
      </div>

      <div className="udt-meta">
        {faNum(filtered.length)} مورد
        {q.trim() ? ` · فیلتر «${q.trim()}»` : ''}
      </div>

      <div className="udt-panel">
        <div className="udt-scroll">
          <table className="udt-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>
                    <span className="udt-th">{c.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((c) => (
                    <td key={c.key}>
                      <div className="udt-cell">{c.render(row)}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {slice.length === 0 && <div className="empty udt-empty">{emptyText}</div>}
        </div>
      </div>

      {pageCount > 1 && (
        <div className="udt-pager">
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
