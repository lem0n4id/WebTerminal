import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/WebTerminal/',
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['node_modules/**', '.claude/**'],
  },
})
