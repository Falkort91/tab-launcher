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
    id: 'tech-watch',
    name: 'Veille tech',
    subcategories: [
      {
        id: 'tech-watch-dev',
        name: 'Actualités & Docs',
        color: 'green',
        links: [
          { id: 'tech-hn', label: 'Hacker News', url: 'https://news.ycombinator.com/' },
          { id: 'tech-mdn', label: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
          { id: 'tech-chrome-ext', label: 'Chrome Extensions Docs', url: 'https://developer.chrome.com/docs/extensions/' },
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
