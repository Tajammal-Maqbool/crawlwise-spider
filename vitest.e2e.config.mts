import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@shared': resolve(import.meta.dirname, 'src/shared') } },
  test: {
    include: ['tests/e2e/**/*.e2e.ts'],
    testTimeout: 120000,
    hookTimeout: 60000,
    fileParallelism: false
  }
})
