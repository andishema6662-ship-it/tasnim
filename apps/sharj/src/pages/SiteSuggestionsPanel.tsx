import { useMemo, useState } from 'react'
import { faDate } from '../lib/format'
import {
  SITE_SUGGESTION_CATEGORIES,
  type SiteSuggestion,
  type SiteSuggestionStatus,
  type StaffRole,
} from '../store/platformTypes'
import { useStore } from '../store/StoreContext'

const STATUS_LABEL: Record<SiteSuggestionStatus, string> = {
  open: 'باز',
  reviewing: 'در بررسی',
  resolved: 'پذیرفته',
  rejected: 'ردشده',
}

export function SiteSuggestionsComposer({
  role,
  complexId,
  buildingId,
  displayName,
}: {
  role: 'complexManager' | 'manager'
  complexId?: string
  buildingId?: string
  displayName: string
}) {
  const { addSiteSuggestion } = useStore()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<(typeof SITE_SUGGESTION_CATEGORIES)[number]>(
    SITE_SUGGESTION_CATEGORIES[0],
  )
  const [toast, setToast] = useState<string | null>(null)

  return (
    <>
      <p className="lead">
        پیشنهاد یا درخواست خود را مستقیماً برای ادمین کل سایت ارسال کنید (جدا از تابلوی پیشنهادات
        ساکنین).
      </p>
      <div className="panel">
        <h3>پیشنهاد به ادمین کل</h3>
        <div className="field">
          <label>دسته</label>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof SITE_SUGGESTION_CATEGORIES)[number])
            }
          >
            {SITE_SUGGESTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>عنوان</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>متن</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={() => {
            if (!title.trim() || !body.trim()) return
            addSiteSuggestion({
              title: title.trim(),
              body: body.trim(),
              category,
              fromRole: role,
              fromName: displayName,
              complexId,
              buildingId,
            })
            setTitle('')
            setBody('')
            setToast('برای ادمین کل ارسال شد')
            setTimeout(() => setToast(null), 2200)
          }}
        >
          ارسال به ادمین کل
        </button>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}

export function SiteSuggestionsReview({
  filterRole,
  complexId,
  buildingId,
}: {
  /** siteAdmin sees all; others see own submissions */
  filterRole?: StaffRole
  complexId?: string
  buildingId?: string
}) {
  const { platform, reviewSiteSuggestion } = useStore()
  const [filter, setFilter] = useState<SiteSuggestionStatus | 'all'>('all')
  const [toast, setToast] = useState<string | null>(null)
  const isAdmin = filterRole === 'siteAdmin'

  const list = useMemo(() => {
    return (platform.admin.siteSuggestions ?? [])
      .filter((s) => {
        if (filter !== 'all' && s.status !== filter) return false
        if (isAdmin) return true
        if (complexId && s.complexId === complexId && s.fromRole === 'complexManager') return true
        if (buildingId && s.buildingId === buildingId) return true
        return false
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [platform.admin.siteSuggestions, filter, isAdmin, complexId, buildingId])

  return (
    <>
      {!isAdmin && (
        <h3 style={{ margin: '12px 0 8px' }}>پیشنهادهای ارسال‌شده شما</h3>
      )}
      {isAdmin && (
        <p className="lead">بررسی پیشنهادات مدیران شهرک و بلوک به ادمین کل.</p>
      )}
      <div className="chip-row">
        {(['all', 'open', 'reviewing', 'resolved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'همه' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {list.map((s: SiteSuggestion) => (
        <div className="panel" key={s.id}>
          <div className="list-item" style={{ paddingTop: 0 }}>
            <div>
              <div className="title">{s.title}</div>
              <div className="sub">
                {s.category} · {s.fromName} (
                {s.fromRole === 'complexManager' ? 'مدیر شهرک' : 'مدیر بلوک'})
                <br />
                {faDate(s.createdAt)}
                <br />
                {s.body}
                {s.reviewNote ? (
                  <>
                    <br />
                    پاسخ: {s.reviewNote}
                  </>
                ) : null}
              </div>
            </div>
            <span
              className={`badge ${
                s.status === 'resolved'
                  ? 'ok'
                  : s.status === 'rejected'
                    ? 'danger'
                    : s.status === 'reviewing'
                      ? 'warn'
                      : 'soon'
              }`}
            >
              {STATUS_LABEL[s.status]}
            </span>
          </div>
          {isAdmin && (s.status === 'open' || s.status === 'reviewing') && (
            <div className="grid-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  reviewSiteSuggestion(s.id, 'reviewing', 'در حال بررسی')
                  setToast('به وضعیت بررسی رفت')
                  setTimeout(() => setToast(null), 1800)
                }}
              >
                در بررسی
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  reviewSiteSuggestion(s.id, 'resolved', 'پذیرفته شد')
                  setToast('پذیرفته شد')
                  setTimeout(() => setToast(null), 1800)
                }}
              >
                پذیرش
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  reviewSiteSuggestion(s.id, 'rejected', 'در حال حاضر قابل اجرا نیست')
                  setToast('رد شد')
                  setTimeout(() => setToast(null), 1800)
                }}
              >
                رد
              </button>
            </div>
          )}
        </div>
      ))}
      {list.length === 0 && <div className="empty">موردی نیست.</div>}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
