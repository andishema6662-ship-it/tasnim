import { useMemo, useState } from 'react'
import { faDate, faNum } from '../../lib/format'
import {
  SITE_SUPPORT_PRIORITY_LABEL,
  SITE_SUPPORT_STATUS_LABEL,
  type SiteSupportPriority,
  type SiteSupportStatus,
  type SiteSupportTicket,
} from '../../store/platformTypes'
import { useStore } from '../../store/StoreContext'

type View = 'list' | 'detail' | 'new'

export function SiteAdminSupport({ onFlash }: { onFlash: (m: string) => void }) {
  const {
    platform,
    upsertSupportTicket,
    replySupportTicket,
    setSupportTicketStatus,
  } = useStore()
  const [view, setView] = useState<View>('list')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SiteSupportStatus | 'all'>('all')
  const [reply, setReply] = useState('')
  const [form, setForm] = useState({
    subject: '',
    category: 'عمومی',
    priority: 'normal' as SiteSupportPriority,
    requesterName: '',
    body: '',
    complexId: '',
    buildingId: '',
  })

  const tickets = platform.admin.supportTickets ?? []
  const filtered = useMemo(
    () =>
      tickets.filter((t) => (statusFilter === 'all' ? true : t.status === statusFilter)),
    [tickets, statusFilter],
  )
  const active = tickets.find((t) => t.id === activeId) ?? null

  const openDetail = (id: string) => {
    setActiveId(id)
    setView('detail')
    setReply('')
  }

  if (view === 'new') {
    return (
      <div className="sa-support">
        <button type="button" className="btn btn-ghost" onClick={() => setView('list')}>
          ← بازگشت به فهرست
        </button>
        <div className="panel" style={{ marginTop: 12 }}>
          <h3>تیکت پشتیبانی جدید</h3>
          <div className="field">
            <label>موضوع</label>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <div className="grid-actions">
            <div className="field">
              <label>دسته</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="field">
              <label>اولویت</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as SiteSupportPriority })
                }
              >
                <option value="low">کم</option>
                <option value="normal">عادی</option>
                <option value="high">بالا</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>درخواست‌کننده</label>
            <input
              value={form.requesterName}
              onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
            />
          </div>
          <div className="grid-actions">
            <div className="field">
              <label>شهرک (اختیاری)</label>
              <select
                value={form.complexId}
                onChange={(e) => setForm({ ...form, complexId: e.target.value })}
              >
                <option value="">—</option>
                {platform.admin.complexes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>ملک (اختیاری)</label>
              <select
                value={form.buildingId}
                onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
              >
                <option value="">—</option>
                {platform.buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>متن</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={5}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => {
              if (!form.subject.trim() || !form.body.trim()) return
              const at = new Date().toISOString()
              const ticket: SiteSupportTicket = {
                id: `sup-${Date.now()}`,
                subject: form.subject.trim(),
                category: form.category.trim() || 'عمومی',
                priority: form.priority,
                status: 'open',
                requesterName: form.requesterName.trim() || 'کاربر',
                complexId: form.complexId || undefined,
                buildingId: form.buildingId || undefined,
                body: form.body.trim(),
                messages: [
                  {
                    id: `sm-${Date.now()}`,
                    author: form.requesterName.trim() || 'کاربر',
                    body: form.body.trim(),
                    at,
                    fromStaff: false,
                  },
                ],
                createdAt: at,
                updatedAt: at,
              }
              upsertSupportTicket(ticket)
              onFlash('تیکت ثبت شد')
              openDetail(ticket.id)
            }}
          >
            ثبت تیکت
          </button>
        </div>
      </div>
    )
  }

  if (view === 'detail' && active) {
    return (
      <div className="sa-support">
        <button type="button" className="btn btn-ghost" onClick={() => setView('list')}>
          ← بازگشت به فهرست
        </button>
        <div className="panel" style={{ marginTop: 12 }}>
          <div className="list-item" style={{ paddingTop: 0 }}>
            <div>
              <div className="title">{active.subject}</div>
              <div className="sub">
                {active.requesterName}
                {active.requesterRole ? ` · ${active.requesterRole}` : ''} ·{' '}
                {active.category} · {faDate(active.createdAt)}
              </div>
            </div>
            <span
              className={`badge ${
                active.status === 'closed'
                  ? 'soon'
                  : active.status === 'answered'
                    ? 'ok'
                    : 'warn'
              }`}
            >
              {SITE_SUPPORT_STATUS_LABEL[active.status]}
            </span>
          </div>
          <div className="grid-actions" style={{ marginTop: 8 }}>
            <select
              value={active.status}
              onChange={(e) =>
                setSupportTicketStatus(active.id, e.target.value as SiteSupportStatus)
              }
            >
              {(Object.keys(SITE_SUPPORT_STATUS_LABEL) as SiteSupportStatus[]).map((s) => (
                <option key={s} value={s}>
                  {SITE_SUPPORT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <span className="badge">
              اولویت: {SITE_SUPPORT_PRIORITY_LABEL[active.priority]}
            </span>
          </div>
        </div>

        <div className="panel sa-chat-panel">
          <div className="sa-chat-thread">
            {active.messages.map((m) => (
              <div
                key={m.id}
                className={`sa-chat-bubble ${m.fromStaff ? 'me' : ''}`}
              >
                <div className="who">{m.author}</div>
                <div>{m.body}</div>
                <div className="sub" style={{ marginTop: 4 }}>
                  {faDate(m.at)}
                </div>
              </div>
            ))}
          </div>
          <div className="field">
            <label>پاسخ پشتیبانی</label>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => {
              replySupportTicket(active.id, reply, true)
              setReply('')
              onFlash('پاسخ ارسال شد')
            }}
          >
            ارسال پاسخ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sa-support">
      <p className="lead">تیکت‌های پشتیبانی پلتفرم — فهرست، جزئیات و ثبت تیکت جدید.</p>
      <div className="sa-contact-toolbar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SiteSupportStatus | 'all')}
        >
          <option value="all">همه وضعیت‌ها</option>
          {(Object.keys(SITE_SUPPORT_STATUS_LABEL) as SiteSupportStatus[]).map((s) => (
            <option key={s} value={s}>
              {SITE_SUPPORT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-copper" onClick={() => setView('new')}>
          تیکت جدید
        </button>
      </div>
      <div className="sub" style={{ marginBottom: 10 }}>
        {faNum(filtered.length)} تیکت
      </div>
      <div className="list">
        {filtered.map((t) => (
          <button
            type="button"
            key={t.id}
            className="sa-ticket-row"
            onClick={() => openDetail(t.id)}
          >
            <div>
              <div className="title">{t.subject}</div>
              <div className="sub">
                {t.requesterName} · {t.category} · {faDate(t.updatedAt)}
              </div>
            </div>
            <span
              className={`badge ${
                t.status === 'closed' ? 'soon' : t.status === 'answered' ? 'ok' : 'warn'
              }`}
            >
              {SITE_SUPPORT_STATUS_LABEL[t.status]}
            </span>
          </button>
        ))}
        {filtered.length === 0 && <div className="empty">تیکتی نیست.</div>}
      </div>
    </div>
  )
}
