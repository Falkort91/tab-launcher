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

function isConfig(value: unknown): value is Config {
  return Array.isArray(value) && value.every(isCategory)
}

function isCategory(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const category = value as Record<string, unknown>
  return (
    typeof category.id === 'string' &&
    typeof category.name === 'string' &&
    Array.isArray(category.subcategories) &&
    category.subcategories.every(isSubcategory)
  )
}

function isSubcategory(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const subcategory = value as Record<string, unknown>
  return (
    typeof subcategory.id === 'string' &&
    typeof subcategory.name === 'string' &&
    typeof subcategory.color === 'string' &&
    Array.isArray(subcategory.links) &&
    subcategory.links.every(isLink)
  )
}

function isLink(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const link = value as Record<string, unknown>
  return (
    typeof link.id === 'string' &&
    typeof link.label === 'string' &&
    typeof link.url === 'string'
  )
}
