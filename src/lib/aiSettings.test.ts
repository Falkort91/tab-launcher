import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearAiSettings, getAiSettings, saveAiSettings } from './aiSettings'

function stubChromeStorageLocal(initial: Record<string, unknown> = {}) {
  let store: Record<string, unknown> = initial

  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          store = { ...store, ...items }
        }),
        remove: vi.fn(async (key: string) => {
          const rest = { ...store }
          delete rest[key]
          store = rest
        }),
      },
    },
  })
}

beforeEach(() => {
  stubChromeStorageLocal()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getAiSettings', () => {
  it('returns null when nothing is stored', async () => {
    expect(await getAiSettings()).toBeNull()
  })

  it('returns null when the stored value is malformed', async () => {
    vi.unstubAllGlobals()
    stubChromeStorageLocal({ aiSettings: { provider: 'openrouter', apiKey: 42 } })

    expect(await getAiSettings()).toBeNull()
  })

  it('returns null when the stored api key is blank', async () => {
    vi.unstubAllGlobals()
    stubChromeStorageLocal({ aiSettings: { provider: 'openrouter', apiKey: '   ' } })

    expect(await getAiSettings()).toBeNull()
  })

  it('returns null when the stored provider is unknown', async () => {
    vi.unstubAllGlobals()
    stubChromeStorageLocal({ aiSettings: { provider: 'mistral', apiKey: 'sk-test-123' } })

    expect(await getAiSettings()).toBeNull()
  })
})

describe('saveAiSettings / getAiSettings round-trip', () => {
  it('persists and retrieves the settings', async () => {
    await saveAiSettings({ provider: 'anthropic', apiKey: 'sk-test-123' })

    expect(await getAiSettings()).toEqual({ provider: 'anthropic', apiKey: 'sk-test-123' })
  })
})

describe('clearAiSettings', () => {
  it('removes the stored settings', async () => {
    await saveAiSettings({ provider: 'openai', apiKey: 'sk-test-123' })
    await clearAiSettings()

    expect(await getAiSettings()).toBeNull()
  })
})
