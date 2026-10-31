import { useState } from 'react'
import type { GoogleAccountSettingsProps } from '../../interfaces/googleProps'
import { Button } from '../common/Button'
import { PasswordField } from '../common/PasswordField'
import { TextField } from '../common/TextField'

export function GoogleAccountSettings({ google }: GoogleAccountSettingsProps) {
  const [typedClientId, setClientId] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState('')
  const status = google.status
  const clientId = typedClientId ?? status?.clientId ?? ''

  return (
    <>
      <h3>Google Account</h3>
      <p className="hint">
        Search Console and GA4 data are in your Google account, so you must sign in once. Create a Desktop app OAuth client in Google Cloud. The steps are in the README, in the Google setup section.
      </p>
      {status?.connected ? (
        <div className="field">
          <span>Connected</span>
          <span className="combo">
            <span className="google-status">{status.email ?? 'Google account'}</span>
            <Button disabled={google.busy} onClick={() => void google.disconnect()}>
              Disconnect
            </Button>
          </span>
        </div>
      ) : (
        <>
          <TextField label="OAuth Client ID" value={clientId} onChange={setClientId} />
          <PasswordField label="OAuth Client Secret" value={clientSecret} onChange={setClientSecret} />
          <div className="field">
            <span />
            <span className="combo">
              <Button disabled={google.busy} onClick={() => void google.connect(clientId, clientSecret)}>
                {google.busy ? 'Waiting for Google sign-in...' : 'Connect'}
              </Button>
            </span>
          </div>
        </>
      )}
      {google.error && <div className="error-banner">{google.error}</div>}
    </>
  )
}
