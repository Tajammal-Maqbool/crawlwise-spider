export interface GoogleAccountStatus {
  connected: boolean
  email: string | null
  clientId: string | null
}

export interface GoogleProperty {
  id: string
  name: string
}
