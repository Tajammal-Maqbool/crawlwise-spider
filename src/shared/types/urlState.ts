export const URL_STATE = {
  discovered: 0,
  queued: 1,
  inProgress: 2,
  done: 3
} as const

export type UrlState = (typeof URL_STATE)[keyof typeof URL_STATE]
