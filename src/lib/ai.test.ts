import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseSuggestion, suggestGroupMeta } from './ai'
import type { AiSettings } from './aiSettings'
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

    await expect(suggestGroupMeta({ provider: 'openrouter', apiKey: 'sk-test' }, [])).rejects.toThrow(
      'Ajoute au moins un lien',
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  describe.each<{ provider: AiSettings['provider']; url: string }>([
    { provider: 'openrouter', url: 'https://openrouter.ai/api/v1/chat/completions' },
    { provider: 'openai', url: 'https://api.openai.com/v1/chat/completions' },
  ])('with the OpenAI-compatible provider "$provider"', ({ provider, url }) => {
    it('returns the parsed suggestion and calls the right endpoint with a bearer token', async () => {
      stubFetchJson(200, {
        choices: [{ message: { content: '{"name": "Recherche emploi", "color": "blue"}' } }],
      })

      await expect(suggestGroupMeta({ provider, apiKey: 'sk-test' }, links)).resolves.toEqual({
        name: 'Recherche emploi',
        color: 'blue',
      })

      const [calledUrl, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
      expect(calledUrl).toBe(url)
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test')
    })
  })

  describe('with the anthropic provider', () => {
    it('returns the parsed suggestion from a forced tool_use block, calling the anthropic endpoint with x-api-key', async () => {
      stubFetchJson(200, {
        content: [{ type: 'tool_use', name: 'set_group_suggestion', input: { name: 'Recherche emploi', color: 'blue' } }],
      })

      await expect(suggestGroupMeta({ provider: 'anthropic', apiKey: 'sk-ant-test' }, links)).resolves.toEqual({
        name: 'Recherche emploi',
        color: 'blue',
      })

      const [calledUrl, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
      expect(calledUrl).toBe('https://api.anthropic.com/v1/messages')
      const headers = init.headers as Record<string, string>
      expect(headers['x-api-key']).toBe('sk-ant-test')
      expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true')

      const body = JSON.parse(init.body as string) as { tool_choice?: { type: string; name: string } }
      expect(body.tool_choice).toEqual({ type: 'tool', name: 'set_group_suggestion' })
    })

    it('falls back to a text content block if the model answers in free text anyway', async () => {
      stubFetchJson(200, {
        content: [{ type: 'text', text: '{"name": "Recherche emploi", "color": "blue"}' }],
      })

      await expect(suggestGroupMeta({ provider: 'anthropic', apiKey: 'sk-ant-test' }, links)).resolves.toEqual({
        name: 'Recherche emploi',
        color: 'blue',
      })
    })

    it('throws when the response has neither a tool_use nor a text block', async () => {
      stubFetchJson(200, { content: [{ type: 'thinking' }] })

      await expect(suggestGroupMeta({ provider: 'anthropic', apiKey: 'sk-ant-test' }, links)).rejects.toThrow(
        'Réponse IA vide',
      )
    })
  })

  it('throws a specific error on a 401 response', async () => {
    stubFetchJson(401, {})

    await expect(suggestGroupMeta({ provider: 'openrouter', apiKey: 'sk-test' }, links)).rejects.toThrow(
      'invalide ou expirée',
    )
  })

  it('throws on other non-ok responses', async () => {
    stubFetchJson(500, {})

    await expect(suggestGroupMeta({ provider: 'openrouter', apiKey: 'sk-test' }, links)).rejects.toThrow('code 500')
  })

  it('throws when the response has no message content', async () => {
    stubFetchJson(200, { choices: [] })

    await expect(suggestGroupMeta({ provider: 'openrouter', apiKey: 'sk-test' }, links)).rejects.toThrow(
      'Réponse IA vide',
    )
  })

  it('throws when fetch rejects (network error or CORS block)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )

    await expect(suggestGroupMeta({ provider: 'openrouter', apiKey: 'sk-test' }, links)).rejects.toThrow(
      'Impossible de contacter',
    )
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

  it.each([
    ['gray', 'grey'],
    ['navy', 'blue'],
    ['indigo', 'blue'],
    ['teal', 'cyan'],
    ['violet', 'purple'],
    ['magenta', 'pink'],
    ['amber', 'yellow'],
    ['lime', 'green'],
    ['crimson', 'red'],
  ])('maps the common synonym "%s" to "%s"', (synonym, expected) => {
    expect(parseSuggestion(`{"name": "X", "color": "${synonym}"}`)).toEqual({ name: 'X', color: expected })
  })

  it('falls back to grey when the color is not part of the known palette or its synonyms', () => {
    expect(parseSuggestion('{"name": "X", "color": "chartreuse"}')).toEqual({ name: 'X', color: 'grey' })
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
