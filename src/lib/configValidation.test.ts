import { describe, expect, it } from 'vitest'
import { isConfig } from './configValidation'

const validConfig = [
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

describe('isConfig', () => {
  it('accepts a well-formed config', () => {
    expect(isConfig(validConfig)).toBe(true)
  })

  it('rejects a non-array value', () => {
    expect(isConfig({ foo: 'bar' })).toBe(false)
  })

  it('rejects a link with a missing field', () => {
    const broken = [
      { id: 'c1', name: 'X', subcategories: [{ id: 's1', name: 'Y', color: 'grey', links: [{ id: 'l1' }] }] },
    ]
    expect(isConfig(broken)).toBe(false)
  })

  it('rejects a subcategory color that is not a real Chrome tab group color', () => {
    const broken = [
      { id: 'c1', name: 'X', subcategories: [{ id: 's1', name: 'Y', color: 'teal', links: [] }] },
    ]
    expect(isConfig(broken)).toBe(false)
  })

  it('rejects a link whose url is not a valid http(s) URL', () => {
    const broken = [
      {
        id: 'c1',
        name: 'X',
        subcategories: [
          { id: 's1', name: 'Y', color: 'grey', links: [{ id: 'l1', label: 'Bad', url: 'not a url' }] },
        ],
      },
    ]
    expect(isConfig(broken)).toBe(false)
  })

  it('rejects duplicate category ids', () => {
    const broken = [
      { id: 'dup', name: 'A', subcategories: [] },
      { id: 'dup', name: 'B', subcategories: [] },
    ]
    expect(isConfig(broken)).toBe(false)
  })

  it('rejects duplicate subcategory ids within the same category', () => {
    const broken = [
      {
        id: 'c1',
        name: 'X',
        subcategories: [
          { id: 'dup', name: 'A', color: 'grey', links: [] },
          { id: 'dup', name: 'B', color: 'blue', links: [] },
        ],
      },
    ]
    expect(isConfig(broken)).toBe(false)
  })

  it('rejects duplicate link ids within the same subcategory', () => {
    const broken = [
      {
        id: 'c1',
        name: 'X',
        subcategories: [
          {
            id: 's1',
            name: 'Y',
            color: 'grey',
            links: [
              { id: 'dup', label: 'A', url: 'https://a.com' },
              { id: 'dup', label: 'B', url: 'https://b.com' },
            ],
          },
        ],
      },
    ]
    expect(isConfig(broken)).toBe(false)
  })
})
