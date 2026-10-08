import { useState } from 'react'
import { buildResidentInviteSms, SHARJ_APK_URL, SHARJ_INSTALL_URL } from '../lib/inviteSms'
import { useBuildingState, useStore } from '../store/StoreContext'

/** Manager invite SMS: fixed template + copy-to-clipboard (marks onboarding invite step). */
export function InviteSmsCard() {
  const { markInviteSmsCopied } = useStore()
  const state = useBuildingState()
  const role = state.session.role
  const canInvite = role === 'manager' || role === 'financeManager'
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canInvite) return null

  const text = buildResidentInviteSms(state.buildingName, SHARJ_INSTALL_URL)
  const already = Boolean(state.managerOnboarding?.inviteSmsCopied)

  const onCopy = async () => {
    setError(null)
    try {
      await navigator.clipboard.writeText(text)
      markInviteSmsCopied()
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Fallback for older WebViews
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        markInviteSmsCopied()
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      } catch {
        setError('کپی نشد — متن را دستی انتخاب کنید.')
      }
    }
  }

  return (
    <div className="panel invite-sms-card">
      <h3>پیامک دعوت ساکنین</h3>
      <p className="sub" style={{ marginTop: 0 }}>
        متن ثابت را کپی کنید و برای ساکنین بفرستید (نصب / ورود به سامانه).
      </p>
      <pre className="invite-sms-text" dir="rtl">
        {text}
      </pre>
      <p className="sub invite-sms-meta">
        لینک وب: {SHARJ_INSTALL_URL}
        <br />
        APK (اختیاری): {SHARJ_APK_URL}
      </p>
      <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={onCopy}>
        {copied ? 'کپی شد ✓' : 'کپی متن پیامک'}
      </button>
      {already && !copied && (
        <div className="badge ok" style={{ marginTop: 8 }}>
          دعوت کپی شده — مرحله دعوت تکمیل می‌شود
        </div>
      )}
      {error && (
        <div className="badge danger" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  )
}
