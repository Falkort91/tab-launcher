import { describe, expect, it } from 'vitest'
import { TAB_GROUP_COLOR_HEX, TAB_GROUP_COLORS } from './tabGroupColors'

describe('TAB_GROUP_COLOR_HEX', () => {
  it('has a hex value for every color in TAB_GROUP_COLORS', () => {
    for (const color of TAB_GROUP_COLORS) {
      expect(TAB_GROUP_COLOR_HEX[color]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('has exactly the same set of keys as TAB_GROUP_COLORS', () => {
    expect(Object.keys(TAB_GROUP_COLOR_HEX).sort()).toEqual([...TAB_GROUP_COLORS].sort())
  })
})
