import type { GoogleAccountStatus, GoogleProperty } from '@shared/interfaces/googleAccount'
import type { ConfigSectionProps } from './dialogProps'

export interface GoogleAccountState {
  status: GoogleAccountStatus | null
  busy: boolean
  error: string | null
  sites: GoogleProperty[]
  properties: GoogleProperty[]
  connect: (clientId: string, clientSecret: string) => Promise<void>
  disconnect: () => Promise<void>
  loadSites: () => Promise<void>
  loadProperties: () => Promise<void>
}

export interface GoogleAccountSettingsProps {
  google: GoogleAccountState
}

export interface GoogleSectionProps extends ConfigSectionProps {
  google: GoogleAccountState
}
