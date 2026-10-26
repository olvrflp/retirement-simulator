/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base './' keeps asset URLs relative so the bundle works locally, on a CDN, or under any sub-path.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // Recharts dominates the single bundle (~185 kB gzipped); acceptable for a static app.
  build: { chunkSizeWarningLimit: 700 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
  },
})
