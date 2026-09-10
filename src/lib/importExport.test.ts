import { describe, expect, it } from 'vitest'
import { parseConfig, serializeConfig } from './importExport'
import type { Config } from './types'

const sample: Config = [
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

describe('serializeConfig / parseConfig round-trip', () => {
  it('parses back exactly what was serialized', () => {
    expect(parseConfig(serializeConfig(sample))).toEqual(sample)
  })
})

describe('parseConfig', () => {
  it('throws on invalid JSON', () => {
    expect(() => parseConfig('not json')).toThrow()
  })

  it('throws when the JSON is valid but not a Config shape', () => {
    expect(() => parseConfig(JSON.stringify({ foo: 'bar' }))).toThrow()
  })

  it('throws when a nested link is missing a field', () => {
    const broken = [{ id: 'c1', name: 'X', subcategories: [{ id: 's1', name: 'Y', color: 'grey', links: [{ id: 'l1' }] }] }]
    expect(() => parseConfig(JSON.stringify(broken))).toThrow()
  })

  it('throws when a subcategory color is not a valid Chrome tab group color', () => {
    const broken = [
      { id: 'c1', name: 'X', subcategories: [{ id: 's1', name: 'Y', color: 'teal', links: [] }] },
    ]
    expect(() => parseConfig(JSON.stringify(broken))).toThrow()
  })
})
