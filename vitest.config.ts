import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/browser/**/*.test.ts'],

    alias: {
      '@/': path.resolve(__dirname, './src/')
    }
  }
})