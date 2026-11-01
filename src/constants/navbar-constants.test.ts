import { describe, expect, it } from 'vitest'
import { NAV_ITEMS, SECTION_IDS } from './navbar-constants'

describe('navbar section targets', () => {
  it('orders Universe before Impact and includes every portfolio destination', () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      '#universe',
      '#impact',
      '#work',
      '#experience',
      '#skills',
      '#resume',
    ])
    expect(SECTION_IDS).toEqual([
      'home',
      'universe',
      'impact',
      'work',
      'experience',
      'skills',
      'resume',
      'contact',
    ])
  })
})
