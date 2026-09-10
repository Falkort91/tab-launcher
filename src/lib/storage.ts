import type { Config } from './types'

const STORAGE_KEY = 'config'

export async function getConfig(): Promise<Config> {
  const data = await chrome.storage.local.get(STORAGE_KEY)
  return (data[STORAGE_KEY] as Config | undefined) ?? []
}

export async function saveConfig(config: Config): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: config })
}
