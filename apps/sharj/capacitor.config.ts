import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // Keep legacy applicationId in sync with android/app/build.gradle
  appId: 'ir.diyareminoodari.sharj',
  appName: 'شارژبان',
  webDir: 'dist',
  server: {
    // Load live PWA so store/sideload builds stay in sync with deploy
    url: 'https://sharzhban.ir',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
