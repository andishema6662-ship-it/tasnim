import { useEffect, useState } from 'react'
import {
  fetchZarinpalStatus,
  saveZarinpalServerConfig,
  type ZarinpalCurrency,
  type ZarinpalPublicStatus,
} from '../../lib/zarinpal'
import { useStore } from '../../store/StoreContext'

/** Site-admin ZarinPal settings — merchant ID saved server-side only. */
export function GatewaySettingsPanel() {
  const { platform, updateGatewayConfig } = useStore()
  const gw = platform.admin.gateway
  const [merchantDraft, setMerchantDraft] = useState('')
  const [sandbox, setSandbox] = useState(gw.sandbox ?? true)
  const [enabled, setEnabled] = useState(gw.enabled)
  const [currency, setCurrency] = useState<ZarinpalCurrency>(gw.currency ?? 'IRT')
  const [callbackUrl, setCallbackUrl] = useState(
    gw.callbackUrl || 'https://sharzhban.ir/pay/callback',
  )
  const [mode, setMode] = useState(gw.mode)
  const [bankInfo, setBankInfo] = useState(gw.bankAccountInfo)
  const [server, setServer] = useState<ZarinpalPublicStatus | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refreshStatus = async () => {
    try {
      const st = await fetchZarinpalStatus()
      setServer(st)
      setSandbox(st.sandbox)
      setEnabled(st.enabled)
      setCurrency(st.currency)
      if (st.callback_url) setCallbackUrl(st.callback_url)
      updateGatewayConfig({
        ...gw,
        enabled: st.enabled,
        sandbox: st.sandbox,
        currency: st.currency,
        callbackUrl: st.callback_url || gw.callbackUrl,
        merchantConfigured: st.merchant_configured,
        merchantMasked: st.merchant_masked,
        merchantId: '',
        provider: 'zarinpal',
        mode,
        bankAccountInfo: bankInfo,
      })
    } catch (e) {
      setFlash(
        e instanceof Error
          ? `وضعیت سرور: ${e.message} (در لوکال Vite middleware یا PHP لازم است)`
          : 'خواندن وضعیت سرور ناموفق',
      )
    }
  }

  useEffect(() => {
    void refreshStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount sync only
  }, [])

  const save = async () => {
    setBusy(true)
    setFlash(null)
    try {
      const res = await saveZarinpalServerConfig({
        merchant_id: merchantDraft.trim() || 'unchanged',
        sandbox,
        enabled,
        currency,
        callback_url: callbackUrl.trim(),
      })
      updateGatewayConfig({
        ...gw,
        mode,
        enabled,
        sandbox,
        currency,
        callbackUrl: callbackUrl.trim(),
        bankAccountInfo: bankInfo,
        merchantId: '',
        merchantConfigured: Boolean(res.merchant_configured),
        merchantMasked: res.merchant_masked ?? '',
        provider: 'zarinpal',
      })
      setMerchantDraft('')
      setFlash(
        res.ok
          ? `${res.message ?? 'ذخیره شد'}${res.path_hint ? ` — ${res.path_hint}` : ''}`
          : res.message ?? 'خطا',
      )
      await refreshStatus()
    } catch (e) {
      setFlash(e instanceof Error ? e.message : 'ذخیره ناموفق')
    } finally {
      setBusy(false)
      setTimeout(() => setFlash(null), 5000)
    }
  }

  return (
    <div className="panel">
      <h3>درگاه زرین‌پال / فیش بانکی</h3>
      <p className="sub" style={{ marginTop: 0 }}>
        Merchant ID فقط روی سرور (PHP config) ذخیره می‌شود و در مرورگر نگه داشته نمی‌شود. واحد پول اپ
        تومان است؛ با <strong>IRT</strong> همان مبلغ به زرین‌پال می‌رود، با <strong>IRR</strong> ضربدر
        ۱۰ (ریال).
      </p>

      {server && (
        <div className="badge ok" style={{ display: 'block', marginBottom: 12 }}>
          سرور: {server.sandbox ? 'سندباکس' : 'عملیاتی'} ·{' '}
          {server.merchant_configured
            ? `Merchant ${server.merchant_masked || 'تنظیم‌شده'}`
            : 'Merchant هنوز تنظیم نشده'}
          {server.dev_middleware ? ' · Vite dev API' : ''}
          {server.using_example_config ? ' · config نمونه' : ''}
        </div>
      )}

      <div className="field">
        <label>فعال بودن درگاه</label>
        <select
          value={enabled ? '1' : '0'}
          onChange={(e) => setEnabled(e.target.value === '1')}
        >
          <option value="1">فعال</option>
          <option value="0">غیرفعال</option>
        </select>
      </div>

      <div className="field">
        <label>حالت پذیرش</label>
        <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="gateway">فقط درگاه</option>
          <option value="bank_receipt">فقط فیش بانکی</option>
          <option value="both">هر دو</option>
        </select>
      </div>

      <div className="field">
        <label>سندباکس زرین‌پال</label>
        <select
          value={sandbox ? '1' : '0'}
          onChange={(e) => setSandbox(e.target.value === '1')}
        >
          <option value="1">روشن (sandbox.zarinpal.com)</option>
          <option value="0">خاموش (payment.zarinpal.com)</option>
        </select>
      </div>

      <div className="field">
        <label>واحد ارسال به زرین‌پال</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as ZarinpalCurrency)}
        >
          <option value="IRT">IRT — تومان (پیشنهادی، مطابق مبلغ اپ)</option>
          <option value="IRR">IRR — ریال (مبلغ تومان × ۱۰)</option>
        </select>
      </div>

      <div className="field">
        <label>Merchant ID (۳۶ کاراکتری — فقط سرور)</label>
        <input
          dir="ltr"
          type="password"
          autoComplete="off"
          placeholder={
            server?.merchant_masked
              ? `فعلی: ${server.merchant_masked} — برای تغییر وارد کنید`
              : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
          }
          value={merchantDraft}
          onChange={(e) => setMerchantDraft(e.target.value)}
        />
        <div className="sub" style={{ marginTop: 6 }}>
          یا روی هاست فایل <code>api/zarinpal/config.example.php</code> را به{' '}
          <code>config.php</code> کپی کنید / یا{' '}
          <code>/home/USER/zarinpal-config.php</code> خارج از public_html بسازید.
        </div>
      </div>

      <div className="field">
        <label>Callback URL</label>
        <input
          dir="ltr"
          value={callbackUrl}
          onChange={(e) => setCallbackUrl(e.target.value)}
          placeholder="https://sharzhban.ir/pay/callback"
        />
      </div>

      <div className="field">
        <label>اطلاعات حساب برای فیش بانکی</label>
        <textarea value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} />
      </div>

      <div className="grid-actions">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()}>
          ذخیره تنظیمات درگاه
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={() => void refreshStatus()}
        >
          بروزرسانی وضعیت سرور
        </button>
      </div>
      {flash && (
        <div className="badge ok" style={{ display: 'block', marginTop: 12 }}>
          {flash}
        </div>
      )}
    </div>
  )
}
