import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const alias = { '@shared': resolve(__dirname, 'src/shared') }

export default defineConfig({
  main: {
    resolve: { alias },
    build: {
      rolldownOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          crawlWorker: resolve(__dirname, 'src/main/crawler/crawlWorker.ts'),
          cli: resolve(__dirname, 'src/cli/index.ts')
        }
      }
    }
  },
  preload: {
    resolve: { alias }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    resolve: { alias },
    plugins: [react()],
    define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.1.0') },
    build: {
      rolldownOptions: { input: resolve(__dirname, 'src/renderer/index.html') }
    }
  }
})
