import { useState } from 'react'
import { faDate } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'

export function Chat() {
  const { sendChat } = useStore()
  const state = useBuildingState()
  const [text, setText] = useState('')

  return (
    <div className="page">
      <h2>چت داخلی</h2>
      <p className="lead">ارتباط ساده بین مدیر و واحدها — اسکلت دمو.</p>
      <div className="panel">
        <div className="chat-thread">
          {state.chat.map((m) => {
            const me = m.author === state.session?.displayName
            return (
              <div className={`bubble ${me ? 'me' : ''}`} key={m.id}>
                <div className="who">{m.author}</div>
                <div>{m.body}</div>
                <div className="sub" style={{ marginTop: 4 }}>
                  {faDate(m.createdAt)}
                </div>
              </div>
            )
          })}
        </div>
        <div className="field">
          <label>پیام</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="پیام خود را بنویسید…" />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={() => {
            sendChat(text)
            setText('')
          }}
        >
          ارسال
        </button>
      </div>
      <span className="badge soon">اعلان بلادرنگ و فایل — به‌زودی</span>
    </div>
  )
}
