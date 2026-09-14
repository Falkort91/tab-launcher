const AI_SETTINGS_KEY = 'aiSettings'

export type AiProvider = 'openrouter' | 'anthropic' | 'openai'

export const AI_PROVIDERS: AiProvider[] = ['openrouter', 'anthropic', 'openai']

export const AI_PROVIDER_INFO: Record<AiProvider, { label: string; keyUrl: string }> = {
  openrouter: { label: 'OpenRouter', keyUrl: 'https://openrouter.ai/keys' },
  anthropic: { label: 'Anthropic (Claude)', keyUrl: 'https://console.anthropic.com/settings/keys' },
  openai: { label: 'OpenAI', keyUrl: 'https://platform.openai.com/api-keys' },
}

export interface AiSettings {
  provider: AiProvider
  apiKey: string
}

// Stockée sous une clé chrome.storage.local séparée de la config (et non dans
// Config) : la clé API ne doit jamais se retrouver dans l'export/import JSON,
// qui est pensé pour être partagé ou versionné.
export async function getAiSettings(): Promise<AiSettings | null> {
  const data = await chrome.storage.local.get(AI_SETTINGS_KEY)
  const value = data[AI_SETTINGS_KEY] as Partial<AiSettings> | undefined

  if (
    typeof value !== 'object' ||
    value === null ||
    !AI_PROVIDERS.includes(value.provider as AiProvider) ||
    typeof value.apiKey !== 'string' ||
    value.apiKey.trim() === ''
  ) {
    return null
  }

  return value as AiSettings
}

export async function saveAiSettings(settings: AiSettings): Promise<void> {
  await chrome.storage.local.set({ [AI_SETTINGS_KEY]: settings })
}

export async function clearAiSettings(): Promise<void> {
  await chrome.storage.local.remove(AI_SETTINGS_KEY)
}
