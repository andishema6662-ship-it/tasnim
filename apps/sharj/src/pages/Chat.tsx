import { useState } from 'react'
import { faDate } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'

/** Building-scoped chat — layout inspired by chat templates (original Taskose tokens). */
export function Chat() {
  const { sendChat } = useStore()
  const state = useBuildingState()
  const [text, setText] = useState('')

  return (
    <div className="page">
      <h2>چت داخلی</h2>
      <p className="lead">ارتباط مدیر و واحدها — اسکلت دمو با حباب پیام.</p>
      <div className="panel sa-chat-panel">
        <div className="sa-chat-thread">
          {state.chat.map((m) => {
            const me = m.author === state.session?.displayName
            return (
              <div className={`sa-chat-bubble ${me ? 'me' : ''}`} key={m.id}>
                <div className="who">{m.author}</div>
                <div>{m.body}</div>
                <div className="sub" style={{ marginTop: 4 }}>
                  {faDate(m.createdAt)}
                </div>
              </div>
            )
          })}
          {state.chat.length === 0 && <div className="empty">هنوز پیامی نیست.</div>}
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
              sendChat(text)
              setText('')
            }}
          >
            ارسال
          </button>
        </div>
      </div>
      <span className="badge soon">اعلان بلادرنگ و فایل — به‌زودی</span>
    </div>
  )
}
