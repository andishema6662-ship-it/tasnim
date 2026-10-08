import { useMemo, useState } from 'react'
import { faDate } from '../lib/format'
import { useStore } from '../store/StoreContext'
import type { PollAudience } from '../store/types'

export function Polls() {
  const { state, votePoll, addPoll } = useStore()
  const session = state.session!
  const [title, setTitle] = useState('')
  const [audience, setAudience] = useState<PollAudience>('residents')
  const [options, setOptions] = useState('موافقم\nمخالفم')

  const voterKey = `${session.role}:${session.unitId ?? 'manager'}`
  const canCreate = session.role === 'manager'

  const visiblePolls = useMemo(() => {
    if (session.role === 'manager') return state.polls
    // residents see resident polls; owners (demo: if residentName === ownerName treat as owner too) see both matching
    const unit = state.units.find((u) => u.id === session.unitId)
    const isOwnerOccupant = unit && unit.ownerName === unit.residentName
    return state.polls.filter(
      (p) => p.audience === 'residents' || (p.audience === 'owners' && isOwnerOccupant),
    )
  }, [state.polls, state.units, session])

  return (
    <div className="page">
      <h2>نظرسنجی</h2>
      <p className="lead">مخاطب جدا برای ساکنین و مالکین؛ رأی و نتیجه درجا.</p>

      {visiblePolls.map((p) => {
        const total = p.options.reduce((s, o) => s + o.votes, 0) || 1
        const voted = p.votedBy.includes(voterKey)
        return (
          <div className="panel" key={p.id}>
            <div className="list-item" style={{ paddingTop: 0 }}>
              <div>
                <div className="title">{p.title}</div>
                <div className="sub">
                  مخاطب: {p.audience === 'residents' ? 'ساکنین' : 'مالکین'} · تا {faDate(p.closesAt)}
                </div>
              </div>
              <span className="badge">{p.audience === 'residents' ? 'ساکنین' : 'مالکین'}</span>
            </div>
            {p.options.map((o) => {
              const pct = Math.round((o.votes / total) * 100)
              return (
                <div key={o.id} style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{o.label}</span>
                    <span className="sub">
                      {o.votes} رأی ({pct}٪)
                    </span>
                  </div>
                  <div className="progress">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  {!voted && session.role !== 'manager' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ marginTop: 8, width: '100%' }}
                      onClick={() => votePoll(p.id, o.id)}
                    >
                      رأی به «{o.label}»
                    </button>
                  )}
                </div>
              )
            })}
            {voted && <div className="badge ok" style={{ marginTop: 10 }}>رأی شما ثبت شد</div>}
            {session.role === 'manager' && (
              <div className="sub" style={{ marginTop: 8 }}>مدیر فقط نتیجه را می‌بیند (برای رأی از نقش ساکن وارد شوید).</div>
            )}
          </div>
        )
      })}

      {canCreate && (
        <div className="panel">
          <h3>نظرسنجی جدید</h3>
          <div className="field">
            <label>عنوان</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>مخاطب</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value as PollAudience)}>
              <option value="residents">ساکنین</option>
              <option value="owners">مالکین</option>
            </select>
          </div>
          <div className="field">
            <label>گزینه‌ها (هر خط یکی)</label>
            <textarea value={options} onChange={(e) => setOptions(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => {
              const opts = options
                .split('\n')
                .map((x) => x.trim())
                .filter(Boolean)
              if (!title.trim() || opts.length < 2) return
              addPoll({
                title: title.trim(),
                audience,
                options: opts,
                closesAt: new Date(Date.now() + 14 * 86400000).toISOString(),
              })
              setTitle('')
            }}
          >
            انتشار نظرسنجی
          </button>
        </div>
      )}
    </div>
  )
}
