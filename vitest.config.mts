import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  resolve: {
    alias: {
      'server-only': new URL('./src/test/server-only.ts', import.meta.url).pathname,
    },
    tsconfigPaths: true,
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx,mts,mjs}'],
    exclude: [
      ...configDefaults.exclude,
      'e2e/**',
      'tests/e2e/**',
      'tests/playwright-config.test.ts',
    ],
  },
})
