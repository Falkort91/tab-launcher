import { afterEach, describe, expect, it, vi } from 'vitest'
import { seedDefaultConfigIfEmpty } from './seed'

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

  return () => store
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('seedDefaultConfigIfEmpty', () => {
  it('writes the default config when storage is empty', async () => {
    const getStore = stubChromeStorageLocal()

    await seedDefaultConfigIfEmpty()

    const stored = getStore().config as unknown[]
    expect(Array.isArray(stored)).toBe(true)
    expect(stored.length).toBeGreaterThan(0)
  })

  it('does not overwrite an existing config', async () => {
    const existing = [{ id: 'custom', name: 'Custom', subcategories: [] }]
    const getStore = stubChromeStorageLocal({ config: existing })

    await seedDefaultConfigIfEmpty()

    expect(getStore().config).toEqual(existing)
  })
})
