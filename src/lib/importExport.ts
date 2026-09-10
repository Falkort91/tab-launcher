import { isConfig } from './configValidation'
import type { Config } from './types'

export function serializeConfig(config: Config): string {
  return JSON.stringify(config, null, 2)
}

export function parseConfig(text: string): Config {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Fichier JSON invalide.')
  }

  if (!isConfig(data)) {
    throw new Error('Le fichier ne correspond pas au format attendu.')
  }

  return data
}
