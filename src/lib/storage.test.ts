import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getConfig, saveConfig } from './storage'
import type { Config } from './types'

function stubChromeStorageLocal(initial: Record<string, unknown> = {}) {
  let store: Record<string, unknown> = initial

  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          store = { ...store, ...items }
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

describe('getConfig', () => {
  it('returns an empty array when nothing is stored', async () => {
    expect(await getConfig()).toEqual([])
  })

  it('returns an empty array and does not throw when stored data is malformed', async () => {
    vi.unstubAllGlobals()
    stubChromeStorageLocal({ config: [{ id: 'c1', name: 'X', subcategories: [{ id: 's1' }] }] })

    expect(await getConfig()).toEqual([])
  })
})

describe('saveConfig / getConfig round-trip', () => {
  it('persists and retrieves the config', async () => {
    const config: Config = [
      { id: 'c1', name: 'Gaming', subcategories: [] },
    ]

    await saveConfig(config)

    expect(await getConfig()).toEqual(config)
  })
})
