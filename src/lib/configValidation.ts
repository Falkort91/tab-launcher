import { TAB_GROUP_COLORS } from './tabGroupColors'
import type { Config, TabGroupColor } from './types'

export function isConfig(value: unknown): value is Config {
  return Array.isArray(value) && hasUniqueIds(value) && value.every(isCategory)
}

function isCategory(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const category = value as Record<string, unknown>
  return (
    typeof category.id === 'string' &&
    typeof category.name === 'string' &&
    Array.isArray(category.subcategories) &&
    hasUniqueIds(category.subcategories) &&
    category.subcategories.every(isSubcategory)
  )
}

function isSubcategory(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const subcategory = value as Record<string, unknown>
  return (
    typeof subcategory.id === 'string' &&
    typeof subcategory.name === 'string' &&
    isTabGroupColor(subcategory.color) &&
    Array.isArray(subcategory.links) &&
    hasUniqueIds(subcategory.links) &&
    subcategory.links.every(isLink)
  )
}

function isTabGroupColor(value: unknown): value is TabGroupColor {
  return typeof value === 'string' && (TAB_GROUP_COLORS as string[]).includes(value)
}

function isLink(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const link = value as Record<string, unknown>
  return (
    typeof link.id === 'string' &&
    typeof link.label === 'string' &&
    typeof link.url === 'string' &&
    isValidUrl(link.url)
  )
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Vérifie l'unicité des ids à un niveau du config (catégories entre elles,
// sous-catégories d'une même catégorie, liens d'une même sous-catégorie) : les
// fonctions CRUD de config.ts matchent par id à chaque niveau, un doublon leur
// ferait modifier/supprimer plusieurs entrées au lieu d'une seule.
function hasUniqueIds(items: unknown[]): boolean {
  const ids = items.map((item) =>
    typeof item === 'object' && item !== null ? (item as Record<string, unknown>).id : undefined,
  )
  return new Set(ids).size === ids.length
}
