import type { AiProvider, PageSpeedStrategy, SearchType } from '@shared/interfaces/integrations'
import type { SelectOption } from '../interfaces/fieldProps'

export const PSI_STRATEGY_OPTIONS: Array<SelectOption<PageSpeedStrategy>> = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' }
]

export const AI_PROVIDER_OPTIONS: Array<SelectOption<AiProvider>> = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'ollama', label: 'Ollama (local)' }
]

export const AI_DEFAULT_MODELS: Record<AiProvider, string> = { anthropic: 'claude-opus-5-5', ollama: 'llama3.1' }

export const SEARCH_TYPE_OPTIONS: Array<SelectOption<SearchType>> = [
  { value: 'web', label: 'Web' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'news', label: 'News' },
  { value: 'discover', label: 'Discover' },
  { value: 'googleNews', label: 'Google News' }
]
