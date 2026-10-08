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

## Sideload install (APK)

1. Copy `diyarsharj.apk` to the phone.
2. Settings → Security → allow **Install unknown apps** for Files / Chrome / etc.
3. Open the APK → Install.
4. App opens دیارشارژ and loads `https://sharj.diyareminoodari.ir`.

```bash
adb install -r /cursor/stores/self/media/sharj-app/diyarsharj.apk
```

## Rebuild

```bash
cd apps/sharj
npm run build
npx cap sync android
# create android/keystore.properties from keystore.properties.example + a keystore
cd android && ./gradlew assembleRelease bundleRelease
```

Requires Android SDK (`ANDROID_HOME`) and JDK 17+.
