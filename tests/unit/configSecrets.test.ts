import { describe, expect, it } from 'vitest'
import { mergeConfig } from '@shared/utils/mergeConfig'
import { extractSecrets, hasSecrets, mergeSecrets, stripSecrets } from '@shared/utils/configSecrets'

const base = mergeConfig({})
const withKeys = mergeSecrets(base, { pagespeedApiKey: 'psi', aiApiKey: 'ai' })

describe('config secrets', () => {
  it('merges secrets into the config', () => {
    expect(withKeys.integrations.pagespeed.apiKey).toBe('psi')
    expect(withKeys.integrations.ai.apiKey).toBe('ai')
  })

  it('extracts secrets from the config', () => {
    expect(extractSecrets(withKeys)).toEqual({ pagespeedApiKey: 'psi', aiApiKey: 'ai' })
  })

  it('strips secrets and keeps other fields', () => {
    const stripped = stripSecrets(withKeys)
    expect(extractSecrets(stripped)).toEqual({ pagespeedApiKey: '', aiApiKey: '' })
    expect(stripped.integrations.pagespeed.enabled).toBe(base.integrations.pagespeed.enabled)
  })

  it('reports whether any secret is set', () => {
    expect(hasSecrets(extractSecrets(base))).toBe(false)
    expect(hasSecrets({ pagespeedApiKey: '', aiApiKey: 'x' })).toBe(true)
  })

  it('tolerates a partial stored config without integrations', () => {
    expect(extractSecrets({} as never)).toEqual({ pagespeedApiKey: '', aiApiKey: '' })
  })
})
