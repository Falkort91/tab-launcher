import { describe, expect, it } from 'vitest'
import {
  addCategory,
  addLink,
  addSubcategory,
  deleteCategory,
  deleteLink,
  deleteSubcategory,
  updateCategory,
  updateLink,
  updateSubcategory,
} from './config'
import type { Config } from './types'

function sampleConfig(): Config {
  return [
    {
      id: 'cat1',
      name: 'Gaming',
      subcategories: [
        {
          id: 'sub1',
          name: 'WoW',
          color: 'purple',
          links: [{ id: 'link1', label: 'Wowhead', url: 'https://wowhead.com' }],
        },
      ],
    },
  ]
}

describe('addCategory', () => {
  it('appends a new category with a generated id and no subcategories', () => {
    const result = addCategory([], 'Jobs')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Jobs')
    expect(result[0].subcategories).toEqual([])
    expect(result[0].id.length).toBeGreaterThan(0)
  })
})

describe('updateCategory', () => {
  it('patches the matching category and leaves others untouched', () => {
    const result = updateCategory(sampleConfig(), 'cat1', { name: 'Renamed' })
    expect(result[0].name).toBe('Renamed')
    expect(result[0].subcategories).toEqual(sampleConfig()[0].subcategories)
  })

  it('is a no-op when the category id does not exist', () => {
    const config = sampleConfig()
    expect(updateCategory(config, 'missing', { name: 'X' })).toEqual(config)
  })
})

describe('deleteCategory', () => {
  it('removes the matching category', () => {
    expect(deleteCategory(sampleConfig(), 'cat1')).toEqual([])
  })
})

describe('addSubcategory', () => {
  it('appends a subcategory to the matching category', () => {
    const result = addSubcategory([{ id: 'cat1', name: 'Gaming', subcategories: [] }], 'cat1', {
      name: 'WoW',
      color: 'purple',
    })
    expect(result[0].subcategories).toHaveLength(1)
    expect(result[0].subcategories[0]).toMatchObject({ name: 'WoW', color: 'purple', links: [] })
  })
})

describe('updateSubcategory', () => {
  it('patches the matching subcategory', () => {
    const result = updateSubcategory(sampleConfig(), 'cat1', 'sub1', { color: 'blue' })
    expect(result[0].subcategories[0].color).toBe('blue')
  })
})

describe('deleteSubcategory', () => {
  it('removes the matching subcategory', () => {
    const result = deleteSubcategory(sampleConfig(), 'cat1', 'sub1')
    expect(result[0].subcategories).toEqual([])
  })
})

describe('addLink', () => {
  it('appends a link to the matching subcategory', () => {
    const result = addLink(sampleConfig(), 'cat1', 'sub1', { label: 'Armory', url: 'https://x.com' })
    expect(result[0].subcategories[0].links).toHaveLength(2)
    expect(result[0].subcategories[0].links[1]).toMatchObject({ label: 'Armory', url: 'https://x.com' })
  })
})

describe('updateLink', () => {
  it('patches the matching link', () => {
    const result = updateLink(sampleConfig(), 'cat1', 'sub1', 'link1', { label: 'Wowhead DB' })
    expect(result[0].subcategories[0].links[0].label).toBe('Wowhead DB')
  })
})

describe('deleteLink', () => {
  it('removes the matching link', () => {
    const result = deleteLink(sampleConfig(), 'cat1', 'sub1', 'link1')
    expect(result[0].subcategories[0].links).toEqual([])
  })
})
