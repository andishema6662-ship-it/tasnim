/** Client helpers for ZarinPal via server-side PHP (or Vite dev middleware). */

export type ZarinpalCurrency = 'IRT' | 'IRR'

export type ZarinpalPublicStatus = {
  ok: boolean
  provider: 'zarinpal'
  enabled: boolean
  sandbox: boolean
  currency: ZarinpalCurrency
  callback_url: string
  merchant_configured: boolean
  merchant_masked: string
  using_example_config?: boolean
  amount_note?: string
  dev_middleware?: boolean
}

export type ZarinpalRequestOk = {
  ok: true
  authority: string
  start_pay_url: string
  amount_toman: number
  amount_sent: number
  currency: ZarinpalCurrency
  sandbox: boolean
  fee?: number
  message?: string
}

export type ZarinpalVerifyOk = {
  ok: true
  already_verified?: boolean
  code: number
  ref_id: number | string | null
  card_pan: string | null
  card_hash?: string | null
  authority: string
  amount_toman: number
  currency: ZarinpalCurrency
  sandbox: boolean
  message?: string
}

export type ZarinpalVerifyFail = {
  ok: false
  cancelled?: boolean
  message: string
  authority?: string
  code?: number
}

const INTENT_KEY = 'sharzhban-zp-intent'

export type ZarinpalIntentKind = 'bill' | 'feature_addon' | 'subscription'

export type ZarinpalPaymentIntent = {
  kind: ZarinpalIntentKind
  orderId: string
  amountToman: number
  description: string
  authority?: string
  /** Bill pay */
  billId?: string
  party?: 'owner' | 'resident'
  buildingId?: string
  /** Feature / subscription */
  featureId?: string
  months?: number
  complexId?: string
  createdAt: string
}

export function saveZarinpalIntent(intent: ZarinpalPaymentIntent) {
  sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent))
}

export function loadZarinpalIntent(): ZarinpalPaymentIntent | null {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ZarinpalPaymentIntent
  } catch {
    return null
  }
}

export function clearZarinpalIntent() {
  sessionStorage.removeItem(INTENT_KEY)
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(text.slice(0, 200) || `HTTP ${res.status}`)
  }
}

export async function fetchZarinpalStatus(): Promise<ZarinpalPublicStatus> {
  const res = await fetch('/api/zarinpal/status.php', { credentials: 'same-origin' })
  return parseJson(res)
}

export async function saveZarinpalServerConfig(input: {
  merchant_id?: string
  sandbox: boolean
  enabled: boolean
  currency: ZarinpalCurrency
  callback_url: string
  admin_token?: string
}): Promise<{
  ok: boolean
  message?: string
  merchant_masked?: string
  merchant_configured?: boolean
  path_hint?: string
}> {
  const res = await fetch('/api/zarinpal/save-config.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(input.admin_token ? { 'X-Admin-Token': input.admin_token } : {}),
    },
    body: JSON.stringify(input),
  })
  return parseJson(res)
}

export async function zarinpalRequest(input: {
  amountToman: number
  description: string
  callbackUrl: string
  orderId: string
  mobile?: string
}): Promise<ZarinpalRequestOk> {
  const res = await fetch('/api/zarinpal/request.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount_toman: input.amountToman,
      description: input.description,
      callback_url: input.callbackUrl,
      order_id: input.orderId,
      mobile: input.mobile,
    }),
  })
  const data = await parseJson<ZarinpalRequestOk & { ok: boolean; message?: string }>(res)
  if (!data.ok || !('start_pay_url' in data)) {
    throw new Error(data.message || 'درخواست درگاه ناموفق بود')
  }
  return data as ZarinpalRequestOk
}

export async function zarinpalVerify(input: {
  authority: string
  amountToman: number
  status: string
}): Promise<ZarinpalVerifyOk | ZarinpalVerifyFail> {
  const res = await fetch('/api/zarinpal/verify.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authority: input.authority,
      amount_toman: input.amountToman,
      status: input.status,
    }),
  })
  return parseJson(res)
}

/** Default SPA callback — prefer absolute URL for ZarinPal redirect. */
export function defaultCallbackUrl(configured?: string): string {
  if (configured?.startsWith('http')) return configured
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/pay/callback`
  }
  return 'https://sharzhban.ir/pay/callback'
}
