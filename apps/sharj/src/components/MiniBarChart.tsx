import { faNum } from '../lib/format'

export function MiniBarChart({
  items,
}: {
  items: { label: string; value: number; color?: string }[]
}) {
  const max = Math.max(1, ...items.map((i) => i.value))
  if (items.length === 0) return <div className="empty">داده‌ای نیست.</div>
  return (
    <div className="bar-chart" aria-label="نمودار">
      {items.map((item) => (
        <div className="bar-row" key={item.label}>
          <span className="bar-label">{item.label}</span>
          <div className="bar-track">
            <i
              style={{
                width: `${Math.round((item.value / max) * 100)}%`,
                background: item.color ?? 'var(--teal)',
              }}
            />
          </div>
          <span className="bar-val">{faNum(item.value)}</span>
        </div>
      ))}
    </div>
  )
}
