import { describe, expect, it } from 'vitest'
import {
  clampProgress,
  getDissolveBoundary,
  getHeroDissolveProgress,
  getSunTrailTarget,
  getWheelProgressDelta,
  isVerticalGesture,
} from './cinematic-progress'

describe('cinematic progress mapping', () => {
  it('clamps progress and caps each wheel event', () => {
    expect(clampProgress(-1)).toBe(0)
    expect(clampProgress(1.2)).toBe(1)
    expect(getWheelProgressDelta(120, 0, 900)).toBe(0.055)
    expect(getWheelProgressDelta(-120, 0, 900)).toBe(-0.055)
    expect(getWheelProgressDelta(0, 0, 900)).toBe(0)
    expect(getWheelProgressDelta(2, 1, 900)).toBe(0.025)
    expect(getWheelProgressDelta(900, 2, 900)).toBe(0.055)
    expect(isVerticalGesture(3, -12)).toBe(true)
    expect(isVerticalGesture(20, 2)).toBe(false)
  })

  it('keeps the Hero whole before moving an organic boundary from east to west', () => {
    expect(getHeroDissolveProgress(0.05)).toBe(0)
    expect(getHeroDissolveProgress(0.6)).toBe(1)
    expect(getDissolveBoundary(0, 0.2)).toBe(100)
    expect(getDissolveBoundary(1, 0.8)).toBe(0)
    expect(getDissolveBoundary(0.5, 0.2)).not.toBe(
      getDissolveBoundary(0.5, 0.8),
    )
  })

  it('brings the particle trail in from the right and settles it at center', () => {
    expect(getSunTrailTarget(0).x).toBeGreaterThan(1)
    expect(getSunTrailTarget(1).x).toBeCloseTo(0.5)
  })
})
