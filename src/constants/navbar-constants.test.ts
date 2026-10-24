import { describe, expect, it } from 'vitest'
import { NAV_ITEMS, SECTION_IDS } from './navbar-constants'

describe('navbar section targets', () => {
  it('includes Impact in page order and tracks all slide destinations', () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      '#impact',
      '#work',
      '#experience',
      '#skills',
      '#resume',
    ])
    expect(SECTION_IDS).toEqual([
      'home',
      'impact',
      'work',
      'experience',
      'skills',
      'contact',
    ])
  })
})
