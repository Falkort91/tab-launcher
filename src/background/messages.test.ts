import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleMessage } from './messages'
import type { Subcategory } from '../lib/types'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('handleMessage', () => {
  it('returns ok:true when openTabGroup succeeds', async () => {
    let nextId = 1
    vi.stubGlobal('chrome', {
      tabs: {
        create: vi.fn(async () => ({ id: nextId++ })),
        group: vi.fn(async () => 42),
        update: vi.fn(async () => undefined),
      },
      tabGroups: { update: vi.fn(async () => undefined) },
    })

    const subcategory: Subcategory = {
      id: 'sub1',
      name: 'WoW',
      color: 'purple',
      links: [{ id: 'l1', label: 'Wowhead', url: 'https://wowhead.com' }],
    }

    const response = await handleMessage({ type: 'openTabGroup', subcategory })

    expect(response).toEqual({ ok: true })
  })

  it('returns ok:false with the error message when openTabGroup throws', async () => {
    vi.stubGlobal('chrome', {
      tabs: {
        create: vi.fn(async () => {
          throw new Error('boom')
        }),
      },
    })

    const subcategory: Subcategory = {
      id: 'sub2',
      name: 'Broken',
      color: 'grey',
      links: [{ id: 'l1', label: 'X', url: 'https://x.com' }],
    }

    const response = await handleMessage({ type: 'openTabGroup', subcategory })

    expect(response.ok).toBe(false)
    expect(response.error).toBe('boom')
  })
})
