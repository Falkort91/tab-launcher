import { isConfig } from './configValidation'
import type { Config } from './types'

const STORAGE_KEY = 'config'

export async function getConfig(): Promise<Config> {
  const data = await chrome.storage.local.get(STORAGE_KEY)
  const value = data[STORAGE_KEY]

  if (value === undefined) return []

  // Le storage n'est pas validé à l'écriture par cette librairie (chrome.storage.local
  // peut être modifié manuellement, ou par une version antérieure de l'extension) — on
  // revalide au chargement, comme pour l'import, plutôt que de laisser une donnée
  // corrompue planter le popup/les options plus loin.
  if (!isConfig(value)) {
    console.error('[tab-launcher] configuration invalide en storage, ignorée.', value)
    return []
  }

  return value
}

export async function saveConfig(config: Config): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: config })
}
