import { useState } from 'react'
import { faDate } from '../lib/format'
import { useBuildingState, useStore } from '../store/StoreContext'

export function News() {
  const { addNews } = useStore()
  const state = useBuildingState()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const isManager = state.session?.role === 'manager'

  return (
    <div className="page">
      <h2>کانال خبری</h2>
      <p className="lead">اطلاعیه‌های ساختمان برای همه واحدها.</p>
      <div className="list">
        {state.news.map((n) => (
          <div className="panel" key={n.id}>
            <div className="title">{n.title}</div>
            <div className="sub" style={{ marginTop: 6 }}>
              {n.body}
              <br />
              {faDate(n.createdAt)}
            </div>
          </div>
        ))}
      </div>
      {isManager && (
        <div className="panel">
          <h3>ارسال خبر</h3>
          <div className="field">
            <label>عنوان</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>متن</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => {
              if (!title.trim() || !body.trim()) return
              addNews({ title: title.trim(), body: body.trim() })
              setTitle('')
              setBody('')
            }}
          >
            انتشار
          </button>
        </div>
      )}
    </div>
  )
}
