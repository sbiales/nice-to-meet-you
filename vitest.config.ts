import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    test: {
      environment: 'node',
      include: ['__tests__/**/*.test.ts'],
      globals: true,
      env,
    },
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./app', import.meta.url)),
        '~~': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
  }
})
