# دیارشارژ (`apps/sharj`)

PWA موبایل‌اول برای **مدیریت شارژ ساختمان** — مستقل از پنل تحریریه شمسه.

- Live: https://sharj.diyareminoodari.ir
- Document root (cPanel): `/home/h430544/sharj`
- Stack: Vite + React + TypeScript + vite-plugin-pwa
- داده دمو: `localStorage` کلید `diyarsharj-v2` (چندساختمانی)
- مدیر سایت دمو: کاربر `admin` / رمز `admin123` → `/app/site-admin`

## توسعه

```bash
cd apps/sharj
npm install
npm run dev
npm run build   # خروجی: dist/
```

## استقرار

محتوای `dist/` را در docroot ساب‌دامین `sharj` آپلود کنید (همراه `.htaccess` برای SPA).

## گسترش

- منطق شارژ: `src/lib/charges.ts`
- state و اکشن‌ها: `src/store/StoreContext.tsx` + `seed.ts`
- صفحات: `src/pages/*` — جلسات: `/app/meetings`
- نقش‌ها: ورود از `/login` (`manager` | `resident`)
