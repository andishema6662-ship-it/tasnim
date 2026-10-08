import { Link } from 'react-router-dom'
import { canSeeBroadcast } from '../lib/broadcasts'
import { faDate } from '../lib/format'
import { useStore } from '../store/StoreContext'

/** Persistent home/complex slot for live manager broadcasts. */
export function BroadcastBanner({ manageTo }: { manageTo?: string }) {
  const { platform, session } = useStore()
  const live = (platform.admin.broadcasts ?? [])
    .filter((b) => canSeeBroadcast(b, session, platform.buildings))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

  if (live.length === 0) return null
  const top = live[0]

  return (
    <div className="broadcast-banner" role="status">
      <div className="broadcast-banner__eyebrow">پیام مدیر · تا {faDate(top.endsAt)}</div>
      <div className="broadcast-banner__title">{top.title}</div>
      <p className="broadcast-banner__body">{top.body}</p>
      {live.length > 1 ? (
        <div className="sub" style={{ marginTop: 6 }}>
          +{live.length - 1} پیام فعال دیگر
          {manageTo ? (
            <>
              {' · '}
              <Link to={manageTo}>مشاهده همه</Link>
            </>
          ) : null}
        </div>
      ) : manageTo ? (
        <div className="sub" style={{ marginTop: 6 }}>
          <Link to={manageTo}>مدیریت پیام‌ها</Link>
        </div>
      ) : null}
    </div>
  )
}
