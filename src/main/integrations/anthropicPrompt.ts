import Anthropic from '@anthropic-ai/sdk'
import type { AiOptions } from '@shared/interfaces/integrations'

const MAX_OUTPUT_TOKENS = 1024

export function createAnthropicRunner(options: AiOptions): (prompt: string) => Promise<string> {
  const client = new Anthropic({ apiKey: options.apiKey || undefined, baseURL: options.baseUrl || undefined })
  return async (prompt) => {
    try {
      const response = await client.beta.messages.create({
        model: options.model,
        max_tokens: MAX_OUTPUT_TOKENS,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        messages: [{ role: 'user', content: prompt }]
      })
      if (response.stop_reason === 'refusal') return 'Refused by the model'
      return response.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('')
        .trim()
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) return 'Error: invalid Anthropic API key'
      if (err instanceof Anthropic.RateLimitError) return 'Error: rate limited'
      if (err instanceof Anthropic.APIError) return `Error: API ${err.status ?? ''} ${err.message}`.slice(0, 300)
      return `Error: ${err instanceof Error ? err.message : String(err)}`.slice(0, 300)
    }
  }
}
