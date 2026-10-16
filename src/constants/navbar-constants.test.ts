import { describe, expect, it } from 'vitest'
import { NAV_ITEMS, SECTION_IDS } from './navbar-constants'

describe('navbar section targets', () => {
  it('exposes only the working Work, Experience, and Skills links', () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      '#work',
      '#experience',
      '#skills',
    ])
    expect(SECTION_IDS).toEqual(['work', 'experience', 'skills', 'contact'])
  })
})
