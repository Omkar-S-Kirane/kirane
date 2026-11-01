import { describe, expect, it } from 'vitest'
import { DEVELOPER_UNIVERSE_PLANETS } from '@/data/developerUniverse'
import {
  orbitApoapsis,
  orbitalPosition,
  resolveOrbitRadius,
  sampleOrbitPath,
  solveEccentricAnomaly,
  toOrbitElements,
} from './orbitalMechanics'
import type { MutableVector3 } from './orbitalMechanics'

const point = (): MutableVector3 => ({ x: 0, y: 0, z: 0 })
const length = (v: MutableVector3) => Math.hypot(v.x, v.y, v.z)

describe('orbital mechanics', () => {
  it("solves Kepler's equation", () => {
    for (const e of [0, 0.05, 0.3, 0.6]) {
      for (let m = -3; m <= 3; m += 0.37) {
        const E = solveEccentricAnomaly(m, e)
        expect(E - e * Math.sin(E)).toBeCloseTo(m, 8)
      }
    }
  })

  it('keeps the sun at a focus: distance runs from periapsis to apoapsis', () => {
    const planet = DEVELOPER_UNIVERSE_PLANETS[10]
    const elements = toOrbitElements(planet, planet.orbitalRadius)
    const { semiMajorAxis: a, eccentricity: e } = elements
    let min = Infinity
    let max = -Infinity
    for (let m = 0; m < Math.PI * 2; m += 0.01) {
      const r = length(orbitalPosition(elements, m, point()))
      min = Math.min(min, r)
      max = Math.max(max, r)
    }
    expect(min).toBeCloseTo(a * (1 - e), 2)
    expect(max).toBeCloseTo(a * (1 + e), 2)
    expect(orbitApoapsis(elements)).toBeCloseTo(a * (1 + e), 8)
  })

  it('tilts each orbit by its own inclination', () => {
    const planet = DEVELOPER_UNIVERSE_PLANETS.find((p) => p.id === 'ios')
    if (!planet) throw new Error('missing planet')
    const elements = toOrbitElements(planet, planet.orbitalRadius)
    const path = sampleOrbitPath(elements, 360)
    let maxY = 0
    for (let i = 1; i < path.length; i += 3)
      maxY = Math.max(maxY, Math.abs(path[i]))
    const expected =
      elements.semiMajorAxis *
      Math.sqrt(1 - elements.eccentricity ** 2) *
      Math.sin(elements.inclination)
    expect(maxY).toBeCloseTo(Math.abs(expected), 2)
  })

  it('sweeps faster near periapsis (second law)', () => {
    const elements = {
      semiMajorAxis: 5,
      eccentricity: 0.4,
      inclination: 0,
      node: 0,
      meanMotion: 1,
      initialMeanAnomaly: 0,
    }
    const near = [
      orbitalPosition(elements, 0, point()),
      orbitalPosition(elements, 0.05, point()),
    ]
    const far = [
      orbitalPosition(elements, Math.PI, point()),
      orbitalPosition(elements, Math.PI + 0.05, point()),
    ]
    const step = (p: MutableVector3[]) =>
      Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y, p[1].z - p[0].z)
    expect(step(near)).toBeGreaterThan(step(far) * 2)
  })

  it('moves planets independently: equal time gives different angles', () => {
    const [react, vercel] = [
      DEVELOPER_UNIVERSE_PLANETS[0],
      DEVELOPER_UNIVERSE_PLANETS[DEVELOPER_UNIVERSE_PLANETS.length - 1],
    ].map((planet) => toOrbitElements(planet, planet.orbitalRadius))
    const seconds = 10
    expect(react.meanMotion * seconds).not.toBeCloseTo(
      vercel.meanMotion * seconds,
      1,
    )
  })

  it('spaces featured planets evenly on compact layouts', () => {
    const planet = DEVELOPER_UNIVERSE_PLANETS[0]
    expect(resolveOrbitRadius(planet, 'compact', 0, 12)).toBeCloseTo(2.7)
    expect(resolveOrbitRadius(planet, 'compact', 11, 12)).toBeCloseTo(6.6)
    expect(resolveOrbitRadius(planet, 'wide', 0, 19)).toBe(planet.orbitalRadius)
    expect(resolveOrbitRadius(planet, 'medium', 0, 19)).toBeLessThan(
      planet.orbitalRadius,
    )
  })
})
