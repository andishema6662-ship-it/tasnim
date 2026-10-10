import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { zarinpalDevMiddleware } from './scripts/zarinpalDevMiddleware.ts'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    zarinpalDevMiddleware(rootDir),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon-32.png',
        'apple-touch-icon.png',
        'logo.webp',
        'logo.jpg',
        'logo-mark.png',
        'logo-mark.webp',
        'icons/*.png',
      ],
      manifest: {
        name: 'شارژبان — سامانه مدیریت ساختمان و پرداخت شارژ',
        short_name: 'شارژبان',
        description: 'سامانه مدیریت ساختمان و پرداخت شارژ',
        lang: 'fa',
        dir: 'rtl',
        theme_color: '#1A2B3C',
        background_color: '#ECECEC',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
