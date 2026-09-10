import { getConfig, saveConfig } from '../lib/storage'
import type { Config } from '../lib/types'

export const DEFAULT_CONFIG: Config = [
  {
    id: 'jobs',
    name: "Recherche d'emploi",
    subcategories: [
      {
        id: 'jobs-search',
        name: 'Recherche',
        color: 'blue',
        links: [
          { id: 'jobs-linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/jobs/' },
          { id: 'jobs-indeed', label: 'Indeed', url: 'https://www.indeed.com/' },
        ],
      },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    subcategories: [
      {
        id: 'gaming-wow',
        name: 'World of Warcraft',
        color: 'purple',
        links: [
          { id: 'wow-armory', label: 'Armory', url: 'https://worldofwarcraft.com/en-us/game/pc/character' },
          { id: 'wow-wowhead', label: 'Wowhead', url: 'https://www.wowhead.com/' },
        ],
      },
    ],
  },
]

export async function seedDefaultConfigIfEmpty(): Promise<void> {
  const existing = await getConfig()
  if (existing.length === 0) {
    await saveConfig(DEFAULT_CONFIG)
  }
}
