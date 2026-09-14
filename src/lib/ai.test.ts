import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseSuggestion, suggestGroupMeta } from './ai'
import type { LinkItem } from './types'

const links: LinkItem[] = [
  { id: 'l1', label: 'LinkedIn Jobs', url: 'https://linkedin.com/jobs' },
  { id: 'l2', label: 'Indeed', url: 'https://indeed.com' },
]

function stubFetchJson(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('suggestGroupMeta', () => {
  it('throws without calling fetch when there are no links', async () => {
    vi.stubGlobal('fetch', vi.fn())

    await expect(suggestGroupMeta('sk-test', [])).rejects.toThrow('Ajoute au moins un lien')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns the parsed suggestion on a successful call', async () => {
    stubFetchJson(200, {
      choices: [{ message: { content: '{"name": "Recherche emploi", "color": "blue"}' } }],
    })

    await expect(suggestGroupMeta('sk-test', links)).resolves.toEqual({
      name: 'Recherche emploi',
      color: 'blue',
    })
  })

  it('sends the api key as a bearer token', async () => {
    stubFetchJson(200, {
      choices: [{ message: { content: '{"name": "X", "color": "grey"}' } }],
    })

    await suggestGroupMeta('sk-test', links)

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test')
  })

  it('throws a specific error on a 401 response', async () => {
    stubFetchJson(401, {})

    await expect(suggestGroupMeta('sk-test', links)).rejects.toThrow('invalide ou expirée')
  })

  it('throws on other non-ok responses', async () => {
    stubFetchJson(500, {})

    await expect(suggestGroupMeta('sk-test', links)).rejects.toThrow('code 500')
  })

  it('throws when the response has no message content', async () => {
    stubFetchJson(200, { choices: [] })

    await expect(suggestGroupMeta('sk-test', links)).rejects.toThrow('Réponse IA vide')
  })

  it('throws when fetch rejects (network error)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )

    await expect(suggestGroupMeta('sk-test', links)).rejects.toThrow('Impossible de contacter')
  })
})

describe('parseSuggestion', () => {
  it('parses a strict JSON response', () => {
    expect(parseSuggestion('{"name": "Veille tech", "color": "purple"}')).toEqual({
      name: 'Veille tech',
      color: 'purple',
    })
  })

  it('extracts JSON surrounded by extra text or a markdown fence', () => {
    const content = 'Voici ma proposition :\n```json\n{"name": "Design", "color": "pink"}\n```\nVoilà.'
    expect(parseSuggestion(content)).toEqual({ name: 'Design', color: 'pink' })
  })

  it('is case-insensitive on the color', () => {
    expect(parseSuggestion('{"name": "X", "color": "BLUE"}')).toEqual({ name: 'X', color: 'blue' })
  })

  it('falls back to grey when the color is not part of the known palette', () => {
    expect(parseSuggestion('{"name": "X", "color": "turquoise"}')).toEqual({ name: 'X', color: 'grey' })
  })

  it('throws when no JSON object can be found', () => {
    expect(() => parseSuggestion('pas de json ici')).toThrow('JSON introuvable')
  })

  it('throws when the JSON is malformed', () => {
    expect(() => parseSuggestion('{"name": "X", "color": }')).toThrow('JSON mal formé')
  })

  it('throws when required fields are missing', () => {
    expect(() => parseSuggestion('{"name": "X"}')).toThrow('champs manquants')
  })

  it('throws when the name is blank', () => {
    expect(() => parseSuggestion('{"name": "   ", "color": "blue"}')).toThrow('nom vide')
  })
})
