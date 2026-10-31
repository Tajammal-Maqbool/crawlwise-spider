import { AI_SLOTS } from '@shared/constants/filterRegistry/integrations'
import type { AiOptions, AiProvider } from '@shared/interfaces/integrations'
import type { ConfigSectionProps } from '../../interfaces/dialogProps'
import { AI_DEFAULT_MODELS, AI_PROVIDER_OPTIONS } from '../../constants/integrationOptions'
import { Button } from '../common/Button'
import { CheckField } from '../common/CheckField'
import { NumberField } from '../common/NumberField'
import { PasswordField } from '../common/PasswordField'
import { SelectField } from '../common/SelectField'
import { TextField } from '../common/TextField'

export function AiSettings({ config, onChange }: ConfigSectionProps) {
  const ai = config.integrations.ai
  const set = (patch: Partial<AiOptions>) => onChange({ ...config, integrations: { ...config.integrations, ai: { ...ai, ...patch } } })
  const setPrompt = (i: number, patch: Partial<AiOptions['prompts'][number]>) => set({ prompts: ai.prompts.map((p, j) => (j === i ? { ...p, ...patch } : p)) })

  return (
    <>
      <h3>AI Prompts</h3>
      <CheckField label="Run AI prompts on each page after the crawl" checked={ai.enabled} onChange={(v) => set({ enabled: v })} />
      <SelectField<AiProvider> label="Provider" value={ai.provider} options={AI_PROVIDER_OPTIONS} onChange={(v) => set({ provider: v, model: AI_DEFAULT_MODELS[v] })} />
      {ai.provider === 'anthropic' && <PasswordField label="API Key" value={ai.apiKey} placeholder="Anthropic API key" onChange={(v) => set({ apiKey: v })} />}
      <TextField label="Model" hint={ai.provider === 'anthropic' ? 'claude-haiku-5-5 costs much less for bulk prompts' : undefined} value={ai.model} onChange={(v) => set({ model: v })} />
      {ai.provider === 'ollama' && <TextField label="Ollama URL" value={ai.baseUrl} hint="Default http://localhost:11434" onChange={(v) => set({ baseUrl: v })} />}
      <NumberField label="Max Pages" value={ai.maxPages} min={1} onChange={(v) => set({ maxPages: v })} />
      <NumberField label="Max Page Text Characters" hint="Longer page text is cut, and the prompt says so" value={ai.maxInputChars} min={500} onChange={(v) => set({ maxInputChars: v })} />
      {ai.prompts.map((p, i) => (
        <div key={i} className="field" style={{ gridTemplateColumns: '160px 1fr auto' }}>
          <input type="text" aria-label="Prompt name" placeholder={`Prompt ${i + 1}`} value={p.name} onChange={(e) => setPrompt(i, { name: e.target.value })} />
          <input type="text" aria-label="Prompt" placeholder="Write a better meta description for this page." value={p.prompt} onChange={(e) => setPrompt(i, { prompt: e.target.value })} />
          <Button onClick={() => set({ prompts: ai.prompts.filter((_, j) => j !== i) })}>Remove</Button>
        </div>
      ))}
      <Button disabled={ai.prompts.length >= AI_SLOTS} onClick={() => set({ prompts: [...ai.prompts, { name: '', prompt: '' }] })}>
        Add Prompt
      </Button>
    </>
  )
}
