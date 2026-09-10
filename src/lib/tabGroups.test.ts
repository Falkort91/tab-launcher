import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildTabGroupPlan, openTabGroup } from './tabGroups'
import type { Subcategory } from './types'

describe('buildTabGroupPlan', () => {
  it('maps links to urls and carries the group title/color', () => {
    const subcategory: Subcategory = {
      id: 'sub1',
      name: 'WoW',
      color: 'purple',
      links: [
        { id: 'l1', label: 'Wowhead', url: 'https://wowhead.com' },
        { id: 'l2', label: 'Blizzard', url: 'https://worldofwarcraft.com' },
      ],
    }

    expect(buildTabGroupPlan(subcategory)).toEqual({
      urls: ['https://wowhead.com', 'https://worldofwarcraft.com'],
      groupTitle: 'WoW',
      groupColor: 'purple',
    })
  })

  it('returns an empty urls array for a subcategory with no links', () => {
    const subcategory: Subcategory = { id: 'sub2', name: 'Empty', color: 'grey', links: [] }

    expect(buildTabGroupPlan(subcategory).urls).toEqual([])
  })
})

describe('openTabGroup', () => {
  const tabsCreate = vi.fn()
  const tabsGroup = vi.fn()
  const tabGroupsUpdate = vi.fn()

  beforeEach(() => {
    let nextId = 1
    tabsCreate.mockReset().mockImplementation(async () => ({ id: nextId++ }))
    tabsGroup.mockReset().mockResolvedValue(42)
    tabGroupsUpdate.mockReset().mockResolvedValue(undefined)

    vi.stubGlobal('chrome', {
      tabs: { create: tabsCreate, group: tabsGroup },
      tabGroups: { update: tabGroupsUpdate },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates one tab per link, groups them, and names/colors the group', async () => {
    const subcategory: Subcategory = {
      id: 'sub1',
      name: 'WoW',
      color: 'purple',
      links: [
        { id: 'l1', label: 'Wowhead', url: 'https://wowhead.com' },
        { id: 'l2', label: 'Blizzard', url: 'https://worldofwarcraft.com' },
      ],
    }

    await openTabGroup(subcategory)

    expect(tabsCreate).toHaveBeenCalledTimes(2)
    expect(tabsCreate).toHaveBeenNthCalledWith(1, { url: 'https://wowhead.com' })
    expect(tabsCreate).toHaveBeenNthCalledWith(2, { url: 'https://worldofwarcraft.com' })
    expect(tabsGroup).toHaveBeenCalledWith({ tabIds: [1, 2] })
    expect(tabGroupsUpdate).toHaveBeenCalledWith(42, { title: 'WoW', color: 'purple' })
  })

  it('does nothing when the subcategory has no links', async () => {
    const subcategory: Subcategory = { id: 'sub2', name: 'Empty', color: 'grey', links: [] }

    await openTabGroup(subcategory)

    expect(tabsCreate).not.toHaveBeenCalled()
    expect(tabsGroup).not.toHaveBeenCalled()
  })
})
