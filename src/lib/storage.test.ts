import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getConfig, saveConfig } from './storage'
import type { Config } from './types'

function stubChromeStorageLocal() {
  let store: Record<string, unknown> = {}

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
