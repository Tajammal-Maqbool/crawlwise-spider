import type { SpiderApi } from '@shared/interfaces/spiderApi'

declare global {
  interface Window {
    api: SpiderApi
  }
}

export {}
