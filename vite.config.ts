/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative base so the build works under any GitHub Pages sub-path (routing is hash-based).
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'audio/**/*'],
      manifest: {
        name: 'לומדים ומשחקים',
        short_name: 'לומדים',
        lang: 'he',
        dir: 'rtl',
        start_url: './',
        display: 'standalone',
        background_color: '#EAF6FF',
        theme_color: '#7C5CFF',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,mp3}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
