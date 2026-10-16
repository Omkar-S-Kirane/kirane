import { describe, expect, it } from 'vitest'
import { getSphereTransitionFrame } from './sphere-transition'

describe('getSphereTransitionFrame', () => {
  it('starts from the existing splash sphere transform and rotation speed', () => {
    expect(getSphereTransitionFrame(0, 1440)).toEqual({
      rotationMultiplier: 1,
      scale: 1,
      offsetX: 0,
    })
  })

  it('accelerates smoothly, expands briefly, and moves toward the hero position', () => {
    const early = getSphereTransitionFrame(0.2, 1440)
    const midpoint = getSphereTransitionFrame(0.5, 1440)
    const late = getSphereTransitionFrame(0.85, 1440)

    expect(early.rotationMultiplier).toBeGreaterThan(1)
    expect(midpoint.rotationMultiplier).toBeGreaterThan(early.rotationMultiplier)
    expect(midpoint.scale).toBeGreaterThan(1)
    expect(late.offsetX).toBeGreaterThan(midpoint.offsetX)
  })

  it('settles at normal speed and bounds the responsive offset', () => {
    expect(getSphereTransitionFrame(1, 1440)).toEqual({
      rotationMultiplier: 1,
      scale: 1,
      offsetX: 1,
    })
    expect(getSphereTransitionFrame(1, 768).offsetX).toBeLessThan(1)
    expect(getSphereTransitionFrame(1, 390).offsetX).toBe(0)
  })

  it('does not translate, scale, or accelerate under reduced motion', () => {
    expect(getSphereTransitionFrame(0.5, 1440, true)).toEqual({
      rotationMultiplier: 1,
      scale: 1,
      offsetX: 0,
    })
  })
})
