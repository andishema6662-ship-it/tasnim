# سندبان Archive OCR (`archive-ocr/`)

سامانه دسکتاپ آفلاین بایگانی و نویسه‌خوانی اسناد فارسی، مطابق طرح Stitch (Fluent RTL + Inno Setup 6).

## محصول

| کلید | مقدار |
|------|--------|
| نام | سامانه بایگانی و نویسه‌خوان اسناد فارسی سندبان |
| خروجی نصاب | `ArchiveOCR_Setup_v1.0.0.exe` |
| مقصد نصب | `C:\Program Files\ArchiveOCR` |
| پشته | Electron + React + SQLite (sql.js) + Tesseract.js + Inno Setup 6 |

پوشه جدا از اپ Next موجود در ریشه مخزن است و آن را تغییر نمی‌دهد.

## ساخت روی ویندوز (یک فرمان)

پیش‌نیاز: Node.js 20+، Inno Setup 6 (`ISCC.exe`).

```bat
cd archive-ocr
scripts\build-installer.bat
```

خروجی: `archive-ocr\Output\ArchiveOCR_Setup_v1.0.0.exe`

## ساخت روی لینوکس (بسته آفلاین)

```bash
cd archive-ocr
chmod +x scripts/build-installer.sh
./scripts/build-installer.sh
```

خروجی قابل حمل: `Output/ArchiveOCR_Offline_v1.0.0.zip` (+ منابع `.iss`).  
برای `Setup.exe` واقعی همان زیپ را روی ویندوز باز کرده و `build-installer.bat` را اجرا کنید، یا Wine+ISCC را پیکربندی کنید.

## اجرای توسعه

```bash
cd archive-ocr
npm install
node scripts/fetch-tessdata.mjs
npm run electron:dev
```

## قابلیت آفلاین

- بدون اینترنت در نصب و اجرای اول (مدل `fas.traineddata` داخل بسته)
- ورود/راه‌اندازی مدیر + کلید بازیابی اضطراری (scrypt محلی)
- SQLite محلی (اسناد، پوشه‌ها، FTS، سطل بازیافت)
- OCR فارسی با Tesseract worker و tessdata همراه بسته
- ویزارد Inno: خوش‌آمد ← مجوز ← مسیر/مخزن ← OCR/اسکنر ← پیشرفت/اجرا
