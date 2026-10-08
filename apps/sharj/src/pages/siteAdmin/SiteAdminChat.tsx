import { useMemo, useState } from 'react'
import { faDate } from '../../lib/format'
import { useStore } from '../../store/StoreContext'

/** Full-page site-admin chat — HexaDash/chat-inspired split pane (original CSS). */
export function SiteAdminChat() {
  const { platform, sendSiteChat } = useStore()
  const threads = platform.admin.siteChatThreads ?? []
  const [threadId, setThreadId] = useState(threads[0]?.id ?? '')
  const [text, setText] = useState('')

  const active = threads.find((t) => t.id === threadId) ?? threads[0]
  const messages = useMemo(
    () =>
      (platform.admin.siteChatMessages ?? [])
        .filter((m) => m.threadId === (active?.id ?? ''))
        .sort((a, b) => +new Date(a.at) - +new Date(b.at)),
    [platform.admin.siteChatMessages, active?.id],
  )

  return (
    <div className="sa-chat-layout">
      <aside className="sa-chat-list">
        <div className="sa-chat-list__title">گفتگوها</div>
        {threads.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`sa-chat-list__item ${active?.id === t.id ? 'active' : ''}`}
            onClick={() => setThreadId(t.id)}
          >
            <div className="title">{t.title}</div>
            <div className="sub">
              {t.peerName} · {t.peerRole}
            </div>
            {t.unread > 0 && <span className="sa-chat-unread">{t.unread}</span>}
          </button>
        ))}
        {threads.length === 0 && <div className="empty">گفتگویی نیست.</div>}
      </aside>
      <section className="sa-chat-panel panel">
        {active ? (
          <>
            <header className="sa-chat-panel__head">
              <div>
                <div className="title">{active.title}</div>
                <div className="sub">
                  {active.peerName} · {active.peerRole}
                </div>
              </div>
            </header>
            <div className="sa-chat-thread">
              {messages.map((m) => (
                <div key={m.id} className={`sa-chat-bubble ${m.mine ? 'me' : ''}`}>
                  <div className="who">{m.author}</div>
                  <div>{m.body}</div>
                  <div className="sub" style={{ marginTop: 4 }}>
                    {faDate(m.at)}
                  </div>
                </div>
              ))}
              {messages.length === 0 && <div className="empty">پیامی نیست — شروع کنید.</div>}
            </div>
            <div className="sa-chat-compose">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="پیام خود را بنویسید…"
                rows={2}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  sendSiteChat(active.id, text)
                  setText('')
                }}
              >
                ارسال
              </button>
            </div>
          </>
        ) : (
          <div className="empty">گفتگویی انتخاب نشده.</div>
        )}
      </section>
    </div>
  )
}

/** Compact dock shown across site-admin sections */
export function SiteAdminChatDock({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  const { platform, sendSiteChat } = useStore()
  const threads = platform.admin.siteChatThreads ?? []
  const [threadId, setThreadId] = useState(threads[0]?.id ?? '')
  const [text, setText] = useState('')
  const active = threads.find((t) => t.id === threadId) ?? threads[0]
  const messages = (platform.admin.siteChatMessages ?? [])
    .filter((m) => m.threadId === (active?.id ?? ''))
    .slice(-8)

  return (
    <div className={`sa-chat-dock ${open ? 'open' : ''}`}>
      <button type="button" className="sa-chat-dock__toggle" onClick={onToggle}>
        چت {open ? '▾' : '▴'}
        {(threads.reduce((n, t) => n + t.unread, 0) > 0 && !open) ? (
          <span className="sa-chat-unread">!</span>
        ) : null}
      </button>
      {open && (
        <div className="sa-chat-dock__body">
          <select
            value={active?.id ?? ''}
            onChange={(e) => setThreadId(e.target.value)}
            style={{ width: '100%', marginBottom: 8 }}
          >
            {threads.map((t) => (
              <option key={t.id} value={t.id}>
                {t.peerName}
              </option>
            ))}
          </select>
          <div className="sa-chat-thread sa-chat-thread--compact">
            {messages.map((m) => (
              <div key={m.id} className={`sa-chat-bubble ${m.mine ? 'me' : ''}`}>
                <div>{m.body}</div>
              </div>
            ))}
          </div>
          <div className="sa-chat-compose">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="پیام…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && active) {
                  sendSiteChat(active.id, text)
                  setText('')
                }
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!active) return
                sendSiteChat(active.id, text)
                setText('')
              }}
            >
              ارسال
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
