import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'logo192.png'],
      manifest: {
        name: 'Web Terminal — Learn Linux Commands',
        short_name: 'WebTerm',
        description: 'Learn basic Linux commands in a terminal in your browser.',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#000000',
        background_color: '#000000',
        icons: [
          { src: 'logo192.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  base: '/WebTerminal/',
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['node_modules/**', '.claude/**', 'e2e/**'],
  },
})
