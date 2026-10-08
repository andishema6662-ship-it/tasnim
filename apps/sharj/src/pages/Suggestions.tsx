import { useMemo, useState } from 'react'
import { compressImageFile, formatBytes } from '../lib/image'
import { faDate } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'
import type { SuggestionCategory, SuggestionStatus } from '../store/types'

export function Suggestions() {
  const { addSuggestion, setSuggestionStatus, upsertSuggestionCategory } = useStore()
  const state = useBuildingState()
  const isManager = state.session.role === 'manager'
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [categoryId, setCategoryId] = useState(state.suggestionCategories[0]?.id ?? '')
  const [photo, setPhoto] = useState<string | undefined>()
  const [photoNote, setPhotoNote] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [newCatLabel, setNewCatLabel] = useState('')

  const activeCats = state.suggestionCategories.filter((c) => c.active)
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of state.suggestions) {
      if (s.status === 'hidden' && !isManager) continue
      map.set(s.categoryId, (map.get(s.categoryId) ?? 0) + 1)
    }
    return map
  }, [state.suggestions, isManager])

  const list = useMemo(() => {
    return state.suggestions
      .filter((s) => {
        if (s.status === 'hidden' && !isManager) return false
        if (categoryFilter !== 'all' && s.categoryId !== categoryFilter) return false
        return true
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [state.suggestions, categoryFilter, isManager])

  const catLabel = (id: string) =>
    state.suggestionCategories.find((c) => c.id === id)?.label ?? '—'

  const statusBadge = (status: SuggestionStatus) => {
    if (status === 'resolved') return <span className="badge ok">رسیدگی‌شده</span>
    if (status === 'hidden') return <span className="badge soon">مخفی</span>
    return <span className="badge warn">باز</span>
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setPhotoNote('در حال فشرده‌سازی…')
    const result = await compressImageFile(file)
    if (!result.ok) {
      setPhoto(undefined)
      setPhotoNote(result.error)
      return
    }
    setPhoto(result.dataUrl)
    setPhotoNote(
      result.warned
        ? `عکس آماده شد (${formatBytes(result.bytes)}) — حجم نسبتاً زیاد برای حافظهٔ مرورگر.`
        : `عکس فشرده شد (${formatBytes(result.bytes)}).`,
    )
  }

  const submit = () => {
    if (!title.trim() || !body.trim() || !categoryId) return
    addSuggestion({ categoryId, title, body, photoDataUrl: photo })
    setTitle('')
    setBody('')
    setPhoto(undefined)
    setPhotoNote(null)
    setShowForm(false)
    setToast('پیشنهاد ثبت شد')
    setTimeout(() => setToast(null), 2200)
  }

  return (
    <div className="page">
      <h2>نظرات و پیشنهادات</h2>
      <p className="lead">دسته‌بندی موضوعی — مثلاً ببینید در پارکینگ چه پیشنهادهایی مطرح شده.</p>

      <div className="chip-row">
        <button
          type="button"
          className={`chip ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          همه
        </button>
        {activeCats.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${categoryFilter === c.id ? 'active' : ''}`}
            onClick={() => setCategoryFilter(c.id)}
          >
            {c.label}
            <span className="chip-count">{counts.get(c.id) ?? 0}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-copper"
        style={{ width: '100%', margin: '12px 0' }}
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? 'بستن فرم' : 'ثبت پیشنهاد جدید'}
      </button>

      {showForm && (
        <div className="panel">
          <h3>پیشنهاد تازه</h3>
          <div className="field">
            <label>دسته‌بندی</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {activeCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
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
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="توضیح پیشنهاد؛ می‌توانید نمونه موفق جای دیگر را شرح دهید…"
            />
          </div>
          <div className="field">
            <label>عکس (اختیاری)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <div className="sub" style={{ marginTop: 6 }}>
              حداکثر ۵ مگابایت ورودی؛ پس از فشرده‌سازی حدود ۳۵۰ کیلوبایت برای ذخیره در مرورگر.
            </div>
            {photoNote && <div className="sub">{photoNote}</div>}
            {photo && (
              <button type="button" className="thumb-btn" onClick={() => setLightbox(photo)}>
                <img src={photo} alt="پیش‌نمایش" className="thumb" />
              </button>
            )}
          </div>
          <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={submit}>
            ارسال
          </button>
        </div>
      )}

      {categoryFilter !== 'all' && (
        <div className="panel" style={{ paddingBottom: 10 }}>
          <h3 style={{ margin: 0 }}>موضوع: {catLabel(categoryFilter)}</h3>
          <div className="sub">{list.length} پیشنهاد در این دسته</div>
        </div>
      )}

      <div className="list">
        {list.map((s) => (
          <div className="panel" key={s.id}>
            <div className="list-item" style={{ paddingTop: 0 }}>
              <div style={{ flex: 1 }}>
                <div className="title">{s.title}</div>
                <div className="sub">
                  <span className="badge">{catLabel(s.categoryId)}</span>{' '}
                  {s.authorName} · {faDate(s.createdAt)}
                </div>
              </div>
              {statusBadge(s.status)}
            </div>
            <p className="sub" style={{ margin: '8px 0', lineHeight: 1.7 }}>
              {s.body}
            </p>
            {s.photoDataUrl && (
              <button type="button" className="thumb-btn" onClick={() => setLightbox(s.photoDataUrl!)}>
                <img src={s.photoDataUrl} alt="" className="thumb" />
              </button>
            )}
            {isManager && (
              <div className="grid-actions" style={{ marginTop: 10 }}>
                {s.status !== 'resolved' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setSuggestionStatus(s.id, 'resolved')}
                  >
                    رسیدگی شد
                  </button>
                )}
                {s.status !== 'hidden' ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSuggestionStatus(s.id, 'hidden')}
                  >
                    مخفی
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSuggestionStatus(s.id, 'open')}
                  >
                    نمایش مجدد
                  </button>
                )}
                {s.status === 'resolved' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSuggestionStatus(s.id, 'open')}
                  >
                    بازگشت به باز
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <div className="empty">پیشنهادی در این دسته نیست.</div>}
      </div>

      {isManager && (
        <div className="panel">
          <h3>مدیریت دسته‌ها</h3>
          <div className="list">
            {state.suggestionCategories.map((c: SuggestionCategory) => (
              <div className="list-item" key={c.id}>
                <div className="title">{c.label}</div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => upsertSuggestionCategory({ ...c, active: !c.active })}
                >
                  {c.active ? 'غیرفعال' : 'فعال'}
                </button>
              </div>
            ))}
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>دسته جدید</label>
            <input value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => {
              if (!newCatLabel.trim()) return
              upsertSuggestionCategory({
                id: `cat-${Date.now()}`,
                label: newCatLabel.trim(),
                active: true,
              })
              setNewCatLabel('')
            }}
          >
            افزودن دسته
          </button>
        </div>
      )}

      {lightbox && (
        <div className="lightbox" role="dialog" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="نمایش کامل" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="btn btn-secondary" onClick={() => setLightbox(null)}>
            بستن
          </button>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
