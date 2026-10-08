import { faDate } from '../../lib/format'
import { CHANGELOG_KIND_LABEL, type ChangelogKind } from '../../store/platformTypes'
import { useStore } from '../../store/StoreContext'

const KIND_CLASS: Record<ChangelogKind, string> = {
  new: 'ok',
  improve: 'warn',
  fix: 'soon',
  security: 'danger',
}

export function SiteAdminChangelog() {
  const { platform } = useStore()
  const entries = [...(platform.admin.changelog ?? [])].sort(
    (a, b) => +new Date(b.at) - +new Date(a.at),
  )

  return (
    <div className="sa-changelog">
      <p className="lead">گزارش بروزرسانی‌های پلتفرم — خط زمانی نسخه‌ها.</p>
      <ol className="sa-changelog-timeline">
        {entries.map((c) => (
          <li key={c.id} className="sa-changelog-item">
            <div className="sa-changelog-item__rail" aria-hidden />
            <div className="sa-changelog-item__card panel">
              <div className="list-item" style={{ paddingTop: 0 }}>
                <div>
                  <div className="title">
                    <span className="sa-changelog-ver">{c.version}</span> {c.title}
                  </div>
                  <div className="sub">{faDate(c.at)}</div>
                </div>
                <span className={`badge ${KIND_CLASS[c.kind]}`}>
                  {CHANGELOG_KIND_LABEL[c.kind]}
                </span>
              </div>
              <p className="sa-changelog-item__body">{c.body}</p>
            </div>
          </li>
        ))}
      </ol>
      {entries.length === 0 && <div className="empty">آیتمی نیست.</div>}
    </div>
  )
}
