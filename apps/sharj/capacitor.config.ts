import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ir.diyareminoodari.sharj',
  appName: 'دیارشارژ',
  webDir: 'dist',
  server: {
    // Load live PWA so store/sideload builds stay in sync with deploy
    url: 'https://sharj.diyareminoodari.ir',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
