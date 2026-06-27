import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Kallan & Nattukar',
        short_name: 'Kallan',
        description: 'Kerala Pop Culture Imposter Game',
        theme_color: '#0A1C12',
        background_color: '#0A1C12',
        display: 'standalone'
      }
    })
  ],
})
