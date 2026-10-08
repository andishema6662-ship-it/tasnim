import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { useBuildingState, useStore } from '../store/StoreContext'

function normalizeIban(raw: string) {
  const s = raw.replace(/\s+/g, '').toUpperCase()
  if (s.startsWith('IR')) return s
  if (/^\d+$/.test(s)) return `IR${s}`
  return s
}

function digitsOnly(raw: string) {
  return raw.replace(/\D/g, '')
}

/** Manager registers block bank account (شبا + کارت) — completes onboarding account step. */
export function BlockAccount() {
  const { upsertBlockBankAccount } = useStore()
  const state = useBuildingState()
  const navigate = useNavigate()
  const role = state.session.role
  const canEdit = role === 'manager' || role === 'financeManager'
  const existing = state.blockBankAccount

  const [iban, setIban] = useState(existing?.iban ?? '')
  const [cardNumber, setCardNumber] = useState(existing?.cardNumber ?? '')
  const [holderName, setHolderName] = useState(existing?.holderName ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (!canEdit) {
    return (
      <div className="page">
        <BackButton fallback="/app" />
        <h2>حساب بلوک</h2>
        <div className="empty">فقط مدیر بلوک / مالی می‌تواند حساب بانکی را ثبت کند.</div>
      </div>
    )
  }

  const onSave = () => {
    setError(null)
    const ib = normalizeIban(iban)
    const card = digitsOnly(cardNumber)
    if (!/^IR\d{24}$/.test(ib)) {
      setError('شماره شبا باید با IR و ۲۴ رقم باشد (جمعاً ۲۶ کاراکتر).')
      return
    }
    if (card.length !== 16) {
      setError('شماره کارت باید ۱۶ رقم باشد.')
      return
    }
    upsertBlockBankAccount({
      iban: ib,
      cardNumber: card,
      holderName: holderName.trim() || undefined,
      updatedAt: new Date().toISOString(),
    })
    setSaved(true)
    setTimeout(() => navigate('/app'), 900)
  }

  return (
    <div className="page">
      <div className="page-head">
        <BackButton fallback="/app" />
      </div>
      <h2>حساب بلوک</h2>
      <p className="lead">
        شماره شبا و کارت بانکی بلوک را ثبت کنید تا مرحلهٔ راه‌اندازی «حساب بلوک» تکمیل شود.
      </p>

      <div className="panel">
        <div className="field">
          <label>شماره شبا</label>
          <input
            dir="ltr"
            inputMode="text"
            placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label>شماره کارت</label>
          <input
            dir="ltr"
            inputMode="numeric"
            placeholder="6037••••••••••••"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label>نام صاحب حساب (اختیاری)</label>
          <input
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="به نام هیئت‌مدیره / مدیر"
          />
        </div>
        {error && (
          <div className="badge danger" style={{ marginBottom: 10 }}>
            {error}
          </div>
        )}
        {saved && (
          <div className="badge ok" style={{ marginBottom: 10 }}>
            ذخیره شد — مرحله حساب بلوک تکمیل است
          </div>
        )}
        <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={onSave}>
          ذخیره حساب بانکی
        </button>
      </div>
    </div>
  )
}
