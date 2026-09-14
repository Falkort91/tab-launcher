const AI_SETTINGS_KEY = 'aiSettings'

export interface AiSettings {
  apiKey: string
}

// Stockée sous une clé chrome.storage.local séparée de la config (et non dans
// Config) : la clé API ne doit jamais se retrouver dans l'export/import JSON,
// qui est pensé pour être partagé ou versionné.
export async function getAiSettings(): Promise<AiSettings | null> {
  const data = await chrome.storage.local.get(AI_SETTINGS_KEY)
  const value = data[AI_SETTINGS_KEY]

  if (
    typeof value !== 'object' ||
    value === null ||
    typeof (value as Partial<AiSettings>).apiKey !== 'string' ||
    (value as AiSettings).apiKey.trim() === ''
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
