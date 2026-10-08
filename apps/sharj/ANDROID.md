# دیارشارژ — Android (Capacitor)

Native wrapper around the live PWA at `https://sharj.diyareminoodari.ir`.

| Field | Value |
|-------|--------|
| Package / applicationId | `ir.diyareminoodari.sharj` |
| App name | دیارشارژ |
| Stack | Capacitor Android WebView → live URL |
| Min SDK | 24 |
| Target / compile SDK | 36 |

## Artifacts (user store)

| File | Kind |
|------|------|
| `/cursor/stores/self/media/sharj-app/diyarsharj.apk` | **Release APK**, signed with local upload keystore (`CN=DiyarSharj`) — OK for sideload |
| `/cursor/stores/self/media/sharj-app/diyarsharj.aab` | **Release AAB**, same upload key — for Play Console upload testing |
| `/cursor/stores/self/media/sharj-app/diyarsharj-debug.apk` | Debug-signed APK (Android Debug cert) |

> These are **not** Play App Signing production keys. For store publish: upload the AAB, let Google Play App Signing manage the app signing key, and keep a private upload keystore of your own.

---

## چرا اندروید نصب APK را مسدود یا «ناامن» نشان می‌دهد؟

اندروید به‌صورت پیش‌فرض فقط نصب از **Google Play** را مجاز می‌داند. فایل APK خارج از فروشگاه (sideload) به‌خاطر امنیت سیستم‌عامل هشدار می‌گیرد — این رفتار عادی است و به‌معنای ویروسی بودن اپ نیست.

### نصب دستی (sideload)

1. فایل `diyarsharj.apk` را به گوشی منتقل کنید (دانلود / کابل / پیام‌رسان).
2. در تنظیمات گوشی: **امنیت** یا **برنامه‌ها** → **نصب برنامه‌های ناشناس** / **Install unknown apps** را برای مرورگر یا فایل‌منجر روشن کنید.
3. روی APK بزنید → اگر هشدار «Play Protect» آمد، گزینه **بیشتر / Install anyway** را بزنید (فقط اگر منبع فایل را خودتان می‌شناسید).
4. بعد از نصب، اپ دیارشارژ را باز کنید؛ محتوا از `https://sharj.diyareminoodari.ir` بارگذاری می‌شود.

```bash
adb install -r /cursor/stores/self/media/sharj-app/diyarsharj.apk
```

### مسیر رسمی فروشگاه (پیشنهادی برای کاربران نهایی)

1. در Google Play Console یک اپ با پکیج `ir.diyareminoodari.sharj` بسازید.
2. فایل **AAB** (`diyarsharj.aab`) را آپلود کنید — کنسول APK خام را برای انتشار جدید قبول نمی‌کند.
3. **Play App Signing** را فعال کنید؛ کلید upload فعلی فقط برای تست است، کلید نهایی امضای فروشگاه را گوگل نگه می‌دارد.
4. پس از انتشار، کاربران بدون هشدار «ناشناس» نصب می‌کنند.

---

## Rebuild

```bash
cd apps/sharj
npm run build
npx cap sync android
# create android/keystore.properties from keystore.properties.example + a keystore
cd android && ./gradlew assembleRelease bundleRelease
```

Requires Android SDK (`ANDROID_HOME`) and JDK 17+.
