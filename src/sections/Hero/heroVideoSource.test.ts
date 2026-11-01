import { describe, expect, it } from 'vitest'
import { selectHeroVideo } from './heroVideoSource'

describe('responsive Hero video selection', () => {
  it.each([
    [1920, 1080, 'desktop'],
    [1680, 1050, 'desktop'],
    [1440, 900, 'desktop'],
    [1366, 768, 'desktop'],
    [1280, 800, 'desktop'],
    [1024, 1366, 'mobile'],
    [834, 1194, 'mobile'],
    [768, 1024, 'mobile'],
    [430, 932, 'mobile'],
    [414, 896, 'mobile'],
    [390, 844, 'mobile'],
    [375, 812, 'mobile'],
    [360, 800, 'mobile'],
    [320, 720, 'mobile'],
    [844, 390, 'desktop'],
    [1366, 1024, 'desktop'],
  ] as const)(
    'chooses the closest video composition at %ix%i',
    (width, height, expected) => {
      expect(selectHeroVideo(width, height)).toBe(expected)
    },
  )

  it('keeps a stable desktop choice for unavailable viewport measurements', () => {
    expect(selectHeroVideo(0, 0)).toBe('desktop')
  })

  it('uses hysteresis around a near-square viewport to avoid source churn', () => {
    expect(selectHeroVideo(950, 1000, 'desktop')).toBe('desktop')
    expect(selectHeroVideo(940, 1000, 'desktop')).toBe('mobile')
    expect(selectHeroVideo(1030, 1000, 'mobile')).toBe('mobile')
    expect(selectHeroVideo(1060, 1000, 'mobile')).toBe('desktop')
  })
})
