import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app-icon.png', 'favicon.svg'],
      manifest: {
        name: 'Kallan & Nattukar',
        short_name: 'Kallan',
        description: 'Kerala Pop Culture Imposter Game',
        theme_color: '#0A1C12',
        background_color: '#0A1C12',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        id: '/',
        icons: [
          {
            src: '/app-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})
