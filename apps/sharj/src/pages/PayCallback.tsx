import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { faDateTime, toman } from '../lib/format'
import {
  clearZarinpalIntent,
  loadZarinpalIntent,
  zarinpalVerify,
} from '../lib/zarinpal'
import { useStore } from '../store/StoreContext'

/**
 * ZarinPal returns here: /pay/callback?Authority=…&Status=OK|NOK
 * Verifies via server PHP, then records payment in local store.
 */
export function PayCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { finalizeZarinpalBillPayment, finalizeZarinpalSubscriptionPayment, platform } =
    useStore()
  const [phase, setPhase] = useState<'working' | 'ok' | 'fail'>('working')
  const [message, setMessage] = useState('در حال تأیید پرداخت…')
  const [detail, setDetail] = useState<{
    refId?: string
    cardPan?: string
    authority?: string
    amount?: number
    tracking?: string
    at?: string
  }>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const authority = params.get('Authority') || params.get('authority') || ''
      const status = params.get('Status') || params.get('status') || 'NOK'
      const intent = loadZarinpalIntent()
      if (!authority) {
        setPhase('fail')
        setMessage('شناسه Authority در بازگشت از درگاه یافت نشد.')
        return
      }
      if (!intent || intent.amountToman < 1) {
        setPhase('fail')
        setMessage('جزئیات سفارش در این مرورگر یافت نشد. لطفاً دوباره از اپ پرداخت را شروع کنید.')
        setDetail({ authority })
        return
      }

      try {
        const result = await zarinpalVerify({
          authority,
          amountToman: intent.amountToman,
          status,
        })
        if (cancelled) return

        if (!result.ok) {
          setPhase('fail')
          setMessage(result.message || 'پرداخت تأیید نشد')
          setDetail({ authority })
          clearZarinpalIntent()
          return
        }

        const refId = String(result.ref_id ?? '')
        const cardPan = result.card_pan ?? undefined
        const at = new Date().toISOString()

        if (intent.kind === 'bill' && intent.billId && intent.party) {
          const code = finalizeZarinpalBillPayment({
            billId: intent.billId,
            party: intent.party,
            amount: intent.amountToman,
            authority,
            refId,
            cardPan,
          })
          setDetail({
            refId,
            cardPan,
            authority,
            amount: intent.amountToman,
            tracking: code ?? undefined,
            at,
          })
          setPhase('ok')
          setMessage('پرداخت با موفقیت تأیید و در صورتحساب ثبت شد.')
        } else if (
          (intent.kind === 'feature_addon' || intent.kind === 'subscription') &&
          intent.orderId
        ) {
          const ok = finalizeZarinpalSubscriptionPayment({
            paymentId: intent.orderId,
            authority,
            refId,
            cardPan,
          })
          setDetail({
            refId,
            cardPan,
            authority,
            amount: intent.amountToman,
            tracking: intent.orderId,
            at,
          })
          if (ok) {
            setPhase('ok')
            setMessage('پرداخت اشتراک/افزونه تأیید شد.')
          } else {
            setPhase('fail')
            setMessage('verify موفق بود ولی ردیف اشتراک در اپ پیدا نشد.')
          }
        } else {
          setPhase('fail')
          setMessage('نوع سفارش ناشناخته است.')
        }
        clearZarinpalIntent()
      } catch (e) {
        if (cancelled) return
        setPhase('fail')
        setMessage(e instanceof Error ? e.message : 'خطا در verify')
        setDetail({ authority })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [params, finalizeZarinpalBillPayment, finalizeZarinpalSubscriptionPayment])

  const gw = platform.admin.gateway

  return (
    <div className="app-shell auth">
      <div className="page" style={{ paddingTop: 36 }}>
        <BrandLogo variant="stacked" tag="نتیجه پرداخت زرین‌پال" />

        <div className="panel">
          <h2 style={{ marginTop: 0 }}>
            {phase === 'working' ? 'تأیید پرداخت' : phase === 'ok' ? 'پرداخت موفق' : 'پرداخت ناموفق'}
          </h2>
          <p className="lead">{message}</p>

          {detail.amount != null && (
            <div className="sub">مبلغ: {toman(detail.amount)}</div>
          )}
          {detail.refId && <div className="sub">شماره پیگیری زرین‌پال (Ref): {detail.refId}</div>}
          {detail.authority && (
            <div className="sub" dir="ltr" style={{ textAlign: 'right' }}>
              Authority: {detail.authority}
            </div>
          )}
          {detail.cardPan && <div className="sub">کارت: {detail.cardPan}</div>}
          {detail.tracking && <div className="sub">کد رسید داخلی: {detail.tracking}</div>}
          {detail.at && <div className="sub">زمان (شمسی): {faDateTime(detail.at)}</div>}
          {gw.sandbox && (
            <div className="badge warn" style={{ marginTop: 10 }}>
              حالت سندباکس زرین‌پال
            </div>
          )}

          <div className="grid-actions" style={{ marginTop: 16 }}>
            <Link className="btn btn-primary" to="/app/payments">
              مشاهده پرداخت‌ها
            </Link>
            <Link className="btn btn-secondary" to="/app/bills">
              قبوض
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/app')}>
              خانه
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
