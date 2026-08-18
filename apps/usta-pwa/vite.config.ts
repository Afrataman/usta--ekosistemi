import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['usta-kulubu-icon.svg'],
      manifest: {
        name: 'Usta Kulübü',
        short_name: 'Usta Kulübü',
        description: 'Ustalar için puan, ödül ve kampanya uygulaması',
        theme_color: '#031323',
        background_color: '#020d18',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'tr',
        categories: ['business', 'productivity'],
        icons: [
          { src: '/usta-kulubu-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/usta-kulubu-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
