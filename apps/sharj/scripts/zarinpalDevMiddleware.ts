/**
 * Vite middleware mirroring public/api/zarinpal/*.php for local sandbox tests.
 * Merchant ID stays in apps/sharj/.zarinpal-config.json (gitignored) — never in the client bundle.
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import type { Connect, Plugin } from 'vite'

type ZpConfig = {
  merchant_id: string
  sandbox: boolean
  enabled: boolean
  currency: 'IRT' | 'IRR'
  callback_url: string
  admin_token: string
}

const DEFAULT: ZpConfig = {
  merchant_id: '00000000-0000-0000-0000-000000000000',
  sandbox: true,
  enabled: true,
  currency: 'IRT',
  callback_url: 'http://127.0.0.1:4173/pay/callback',
  admin_token: '',
}

function configPath(root: string) {
  return path.join(root, '.zarinpal-config.json')
}

function loadConfig(root: string): ZpConfig {
  const p = configPath(root)
  if (!fs.existsSync(p)) return { ...DEFAULT }
  try {
    return { ...DEFAULT, ...JSON.parse(fs.readFileSync(p, 'utf8')) }
  } catch {
    return { ...DEFAULT }
  }
}

function saveConfig(root: string, cfg: ZpConfig) {
  fs.writeFileSync(configPath(root), JSON.stringify(cfg, null, 2))
}

function amountForApi(toman: number, currency: 'IRT' | 'IRR') {
  return currency === 'IRR' ? toman * 10 : toman
}

function baseUrls(sandbox: boolean) {
  const host = sandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com'
  return {
    request: `${host}/pg/v4/payment/request.json`,
    verify: `${host}/pg/v4/payment/verify.json`,
    startPay: `${host}/pg/StartPay/`,
  }
}

async function readJson(req: Connect.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(Buffer.from(c))
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

function send(res: http.ServerResponse, code: number, body: unknown) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function mask(mid: string) {
  return mid.length >= 8 ? `${mid.slice(0, 4)}…${mid.slice(-4)}` : ''
}

export function zarinpalDevMiddleware(root: string): Plugin {
  return {
    name: 'zarinpal-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/api/zarinpal/')) return next()

        const cfg = loadConfig(root)

        if (url.endsWith('/status.php') && req.method === 'GET') {
          return send(res, 200, {
            ok: true,
            provider: 'zarinpal',
            enabled: cfg.enabled,
            sandbox: cfg.sandbox,
            currency: cfg.currency,
            callback_url: cfg.callback_url,
            merchant_configured: Boolean(cfg.merchant_id),
            merchant_masked: mask(cfg.merchant_id),
            using_example_config: !fs.existsSync(configPath(root)),
            amount_note:
              cfg.currency === 'IRT'
                ? 'مبالغ اپ به تومان (IRT) برای زرین‌پال ارسال می‌شود.'
                : 'مبالغ اپ (تومان) ×۱۰ به‌صورت ریال (IRR) ارسال می‌شود.',
            dev_middleware: true,
          })
        }

        if (url.endsWith('/save-config.php') && req.method === 'POST') {
          const body = await readJson(req)
          const next: ZpConfig = {
            merchant_id:
              typeof body.merchant_id === 'string' && body.merchant_id && body.merchant_id !== 'unchanged'
                ? body.merchant_id
                : cfg.merchant_id,
            sandbox: typeof body.sandbox === 'boolean' ? body.sandbox : cfg.sandbox,
            enabled: typeof body.enabled === 'boolean' ? body.enabled : cfg.enabled,
            currency: body.currency === 'IRR' ? 'IRR' : 'IRT',
            callback_url:
              typeof body.callback_url === 'string' && body.callback_url
                ? body.callback_url
                : cfg.callback_url,
            admin_token: cfg.admin_token,
          }
          saveConfig(root, next)
          return send(res, 200, {
            ok: true,
            message: 'تنظیمات درگاه ذخیره شد (dev)',
            path_hint: '.zarinpal-config.json',
            enabled: next.enabled,
            sandbox: next.sandbox,
            currency: next.currency,
            callback_url: next.callback_url,
            merchant_masked: mask(next.merchant_id),
            merchant_configured: Boolean(next.merchant_id),
            dev_middleware: true,
          })
        }

        if (url.endsWith('/request.php') && req.method === 'POST') {
          if (!cfg.enabled) return send(res, 403, { ok: false, message: 'درگاه غیرفعال است' })
          const body = await readJson(req)
          const toman = Number(body.amount_toman ?? body.amount ?? 0)
          if (toman < 1000) {
            return send(res, 400, { ok: false, message: 'حداقل مبلغ ۱٬۰۰۰ تومان است' })
          }
          const amount = amountForApi(toman, cfg.currency)
          const urls = baseUrls(cfg.sandbox)
          const callback =
            typeof body.callback_url === 'string' && body.callback_url
              ? body.callback_url
              : cfg.callback_url
          const payload = {
            merchant_id: cfg.merchant_id,
            amount,
            currency: cfg.currency,
            description: String(body.description ?? 'پرداخت شارژبان'),
            callback_url: callback,
            metadata: {
              mobile: body.mobile ? String(body.mobile) : undefined,
              order_id: body.order_id ? String(body.order_id) : undefined,
            },
          }
          try {
            const r = await fetch(urls.request, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify(payload),
            })
            const json = (await r.json()) as {
              data?: { code?: number; authority?: string; fee?: number; message?: string }
              errors?: unknown
            }
            const code = json.data?.code ?? 0
            const authority = json.data?.authority ?? ''
            if (code === 100 && authority) {
              return send(res, 200, {
                ok: true,
                authority,
                fee: json.data?.fee,
                sandbox: cfg.sandbox,
                currency: cfg.currency,
                amount_sent: amount,
                amount_toman: toman,
                start_pay_url: urls.startPay + authority,
                message: json.data?.message ?? 'Success',
                dev_middleware: true,
              })
            }
            return send(res, 502, { ok: false, message: 'ZarinPal request failed', zarinpal: json })
          } catch (e) {
            return send(res, 502, { ok: false, message: String(e) })
          }
        }

        if (url.endsWith('/verify.php') && req.method === 'POST') {
          const body = await readJson(req)
          const authority = String(body.authority ?? '')
          const toman = Number(body.amount_toman ?? body.amount ?? 0)
          const status = String(body.status ?? 'OK').toUpperCase()
          if (!authority || toman < 1) {
            return send(res, 400, { ok: false, message: 'authority و amount_toman لازم است' })
          }
          if (status && status !== 'OK') {
            return send(res, 200, {
              ok: false,
              cancelled: true,
              message: 'پرداخت توسط کاربر لغو شد یا ناموفق بود (Status=NOK)',
              authority,
            })
          }
          const amount = amountForApi(toman, cfg.currency)
          const urls = baseUrls(cfg.sandbox)
          try {
            const r = await fetch(urls.verify, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                merchant_id: cfg.merchant_id,
                amount,
                authority,
              }),
            })
            const json = (await r.json()) as {
              data?: {
                code?: number
                ref_id?: number
                card_pan?: string
                card_hash?: string
                fee?: number
                fee_type?: string
                message?: string
              }
              errors?: unknown
            }
            const code = json.data?.code ?? 0
            if (code === 100 || code === 101) {
              return send(res, 200, {
                ok: true,
                already_verified: code === 101,
                code,
                ref_id: json.data?.ref_id,
                card_pan: json.data?.card_pan,
                card_hash: json.data?.card_hash,
                fee: json.data?.fee,
                fee_type: json.data?.fee_type,
                authority,
                amount_toman: toman,
                amount_sent: amount,
                currency: cfg.currency,
                sandbox: cfg.sandbox,
                message: json.data?.message ?? 'Verified',
                dev_middleware: true,
              })
            }
            return send(res, 502, {
              ok: false,
              message: 'verify failed',
              code,
              authority,
              zarinpal: json.errors ?? json,
              dev_middleware: true,
            })
          } catch (e) {
            return send(res, 502, { ok: false, message: String(e) })
          }
        }

        return next()
      })
    },
  }
}
