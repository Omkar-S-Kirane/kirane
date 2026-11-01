import { describe, expect, it } from 'vitest'
import {
  getActivation,
  getMetricsReveal,
  getOrbitDraw,
  getPlanetEntrance,
  getScrollHintOpacity,
  getSpaceState,
  getSunState,
  isInteractive,
  segment,
  toFormationProgress,
} from './formationTimeline'

const steps = Array.from({ length: 201 }, (_, index) => index / 200)

describe('formation timeline', () => {
  it('maps the first 85% of the section scroll to the formation', () => {
    expect(toFormationProgress(0)).toBe(0)
    expect(toFormationProgress(0.425)).toBeCloseTo(0.5)
    expect(toFormationProgress(0.85)).toBe(1)
    expect(toFormationProgress(1)).toBe(1)
  })

  it('opens with deep space before the sun appears', () => {
    expect(getSpaceState(0).backdrop).toBe(0)
    expect(getSpaceState(0.1).backdrop).toBe(1)
    expect(getSpaceState(0.05).stars).toBeGreaterThan(0)
    const sun = getSunState(0.05)
    expect(sun.form).toBe(0)
    expect(sun.travel).toBe(0)
  })

  it('brings the sun in from the east, forms it, then reveals the text', () => {
    const arriving = getSunState(0.3)
    expect(arriving.light).toBeGreaterThan(0.9)
    expect(arriving.travel).toBeGreaterThan(0)
    expect(arriving.travel).toBeLessThan(1)
    expect(arriving.text).toBe(0)

    const settled = getSunState(0.5)
    expect(settled.travel).toBe(1)
    expect(settled.form).toBe(1)
    expect(settled.scale).toBe(1)
    expect(settled.text).toBe(1)
  })

  it('is a pure function of scroll position, so reversing replays it exactly', () => {
    const forward = steps.map((f) => getSunState(f))
    const backward = [...steps].reverse().map((f) => getSunState(f))
    expect(backward.reverse()).toEqual(forward)
  })

  it('changes continuously with scroll (bounded rate, no jumps)', () => {
    for (let i = 1; i < steps.length; i += 1) {
      const a = getSunState(steps[i - 1])
      const b = getSunState(steps[i])
      expect(Math.abs(b.travel - a.travel)).toBeLessThan(0.1)
      expect(Math.abs(b.scale - a.scale)).toBeLessThan(0.1)
      expect(
        Math.abs(
          getPlanetEntrance(steps[i], 3, 19) -
            getPlanetEntrance(steps[i - 1], 3, 19),
        ),
      ).toBeLessThan(0.1)
    }
  })

  it('reveals planets one after another inside the 50–75% window', () => {
    const count = 19
    const starts = Array.from({ length: count }, (_, index) =>
      steps.find((f) => getPlanetEntrance(f, index, count) > 0),
    )
    for (let i = 1; i < count; i += 1) {
      expect(starts[i]).toBeGreaterThanOrEqual(starts[i - 1] ?? 0)
    }
    expect(getPlanetEntrance(0.5, 0, count)).toBe(0)
    expect(getPlanetEntrance(0.75, count - 1, count)).toBe(1)
    expect(getPlanetEntrance(0.65, 0, count)).toBe(1)
    expect(getPlanetEntrance(0.65, count - 1, count)).toBe(0)
  })

  it('draws orbits inner to outer between 75% and 90%', () => {
    expect(getOrbitDraw(0.75, 0, 19)).toBe(0)
    expect(getOrbitDraw(0.82, 0, 19)).toBe(1)
    expect(getOrbitDraw(0.82, 18, 19)).toBe(0)
    expect(getOrbitDraw(0.9, 18, 19)).toBe(1)
  })

  it('activates the system and enables interaction at the end', () => {
    expect(getActivation(0.81)).toBe(0)
    expect(getActivation(0.94)).toBe(1)
    expect(isInteractive(0.89)).toBe(false)
    expect(isInteractive(0.9)).toBe(true)
  })

  it('reveals metrics after formation and fades the relative scene tagline', () => {
    expect(getMetricsReveal(0.85)).toBe(0)
    expect(getMetricsReveal(1)).toBe(1)
    expect(getScrollHintOpacity(0)).toBe(0)
    expect(getScrollHintOpacity(0.2)).toBeGreaterThan(0.9)
    expect(getScrollHintOpacity(0.5)).toBe(0)
  })

  it('clamps segments outside their window', () => {
    expect(segment(-1, 0, 1)).toBe(0)
    expect(segment(2, 0, 1)).toBe(1)
    expect(segment(0.5, 0.5, 0.5)).toBe(1)
  })
})
