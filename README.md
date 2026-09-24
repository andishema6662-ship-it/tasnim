# تسنیم | سامانه رزرو آنلاین اردوگاه

یک وب‌اپلیکیشن کامل برای رزرو آنلاین اردوگاه با رابط کاربری فارسی (راست‌به‌چپ) و بک‌اند سبک مبتنی بر Express.

A full-stack campground reservation web app with a Persian (RTL) UI and a lightweight Express backend.

## ویژگی‌ها

- نمایش لیست اردوگاه‌ها همراه با موقعیت، امکانات، ظرفیت و قیمت هر شب.
- فرم رزرو با انتخاب تاریخ ورود/خروج و تعداد نفرات و پیش‌نمایش زندهٔ مبلغ کل.
- بررسی ظرفیت بر اساس بازه‌های زمانی هم‌پوشان تا از بیش‌رزرو جلوگیری شود.
- بخش «رزروهای من» برای مشاهدهٔ رزروهای ثبت‌شده.
- نمایش اعداد و قیمت‌ها به‌صورت فارسی و به واحد تومان.

## پیش‌نیازها

- Node.js نسخهٔ ۲۰ یا بالاتر

## راه‌اندازی

```bash
npm install      # نصب وابستگی‌ها
npm start        # اجرای سرور روی http://localhost:3000
npm run dev      # اجرای سرور در حالت توسعه (با ری‌استارت خودکار)
npm test         # اجرای تست‌های خودکار
```

## ساختار پروژه

```
src/
  server.js        # سرور Express و مسیرهای API
  db.js            # دادهٔ اولیهٔ اردوگاه‌ها، ذخیره‌سازی رزروها و منطق ظرفیت/قیمت
public/
  index.html       # صفحهٔ اصلی
  styles.css       # استایل تم تیره و راست‌به‌چپ
  app.js           # منطق سمت کاربر (بارگذاری، فرم رزرو، نمایش رزروها)
test/
  api.test.js      # تست‌های API با node:test
data/
  reservations.json  # فایل ذخیرهٔ رزروها (به‌صورت خودکار ساخته می‌شود؛ در git نادیده گرفته شده)
```

## API

| متد | مسیر | توضیح |
| --- | --- | --- |
| GET | `/api/health` | بررسی سلامت سرویس |
| GET | `/api/camps` | فهرست اردوگاه‌ها |
| GET | `/api/camps/:id` | جزئیات یک اردوگاه |
| GET | `/api/reservations` | فهرست رزروها |
| POST | `/api/availability` | بررسی موجودی/ظرفیت برای یک بازه |
| POST | `/api/reservations` | ثبت رزرو جدید |

نمونهٔ ثبت رزرو:

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H 'Content-Type: application/json' \
  -d '{"campId":"damavand","guestName":"علی رضایی","phone":"09120000000","checkIn":"2026-10-01","checkOut":"2026-10-04","guests":3}'
```

## محیط Cloud Agent

فایل `.cursor/environment.json` وابستگی‌ها را با `npm install` نصب می‌کند و سرور را در ترمینال `web-server` روی پورت ۳۰۰۰ اجرا می‌کند.
