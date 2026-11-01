import { COMPACT_ORBIT_RANGE } from './developerUniverse.constants'
import type {
  TechnologyPlanet,
  UniverseLayoutTier,
} from './developerUniverse.types'

const DEG = Math.PI / 180
const TWO_PI = Math.PI * 2

export interface OrbitElements {
  /** Semi-major axis, in scene units. */
  semiMajorAxis: number
  eccentricity: number
  /** Inclination of the orbital plane, in radians. */
  inclination: number
  /** Longitude of the ascending node, in radians. */
  node: number
  /** Mean motion, in radians per second. */
  meanMotion: number
  /** Mean anomaly at t = 0, in radians. */
  initialMeanAnomaly: number
}

export interface MutableVector3 {
  x: number
  y: number
  z: number
}

/**
 * Orbit radius for the current layout. Compact layouts only show featured
 * planets, re-spaced evenly across a tighter band so that they stay on screen
 * and remain large enough to tap.
 */
export function resolveOrbitRadius(
  planet: TechnologyPlanet,
  tier: UniverseLayoutTier,
  compactIndex: number,
  compactCount: number,
): number {
  if (tier === 'compact') {
    const [inner, outer] = COMPACT_ORBIT_RANGE
    const step = compactCount > 1 ? (outer - inner) / (compactCount - 1) : 0
    return inner + compactIndex * step
  }
  if (tier === 'medium') return 2.9 + (planet.orbitalRadius - 3.4) * 0.92
  return planet.orbitalRadius
}

export function toOrbitElements(
  planet: TechnologyPlanet,
  semiMajorAxis: number,
): OrbitElements {
  return {
    semiMajorAxis,
    eccentricity: Math.min(Math.max(planet.orbitalEccentricity, 0), 0.6),
    inclination: planet.orbitalInclination * DEG,
    node: planet.orbitalNode * DEG,
    meanMotion: planet.orbitalSpeed,
    initialMeanAnomaly: planet.orbitalPhase * DEG,
  }
}

function wrapAngle(angle: number): number {
  const wrapped = (((angle + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI
  return wrapped - Math.PI
}

/** Solves Kepler's equation M = E − e·sin(E) for E with Newton–Raphson. */
export function solveEccentricAnomaly(
  meanAnomaly: number,
  eccentricity: number,
): number {
  const m = wrapAngle(meanAnomaly)
  let e = eccentricity < 0.8 ? m : Math.PI
  for (let i = 0; i < 8; i += 1) {
    const delta =
      (e - eccentricity * Math.sin(e) - m) / (1 - eccentricity * Math.cos(e))
    e -= delta
    if (Math.abs(delta) < 1e-9) break
  }
  return e
}

/**
 * Position on the orbit for an eccentric anomaly, with the sun at the focus
 * (the origin) and +Y up. Bodies travel anticlockwise when seen from above.
 */
export function positionFromEccentricAnomaly(
  elements: OrbitElements,
  eccentricAnomaly: number,
  out: MutableVector3,
): MutableVector3 {
  const { semiMajorAxis: a, eccentricity: e, inclination, node } = elements
  const b = a * Math.sqrt(1 - e * e)
  const px = a * (Math.cos(eccentricAnomaly) - e)
  const pz = -b * Math.sin(eccentricAnomaly)

  // Tilt the orbital plane about the line of nodes (X), then rotate the
  // line of nodes about the vertical axis.
  const cosI = Math.cos(inclination)
  const sinI = Math.sin(inclination)
  const y = -pz * sinI
  const z1 = pz * cosI

  const cosN = Math.cos(node)
  const sinN = Math.sin(node)
  out.x = px * cosN + z1 * sinN
  out.y = y
  out.z = -px * sinN + z1 * cosN
  return out
}

/** Position for a mean anomaly, i.e. with Kepler's second law applied. */
export function orbitalPosition(
  elements: OrbitElements,
  meanAnomaly: number,
  out: MutableVector3,
): MutableVector3 {
  return positionFromEccentricAnomaly(
    elements,
    solveEccentricAnomaly(meanAnomaly, elements.eccentricity),
    out,
  )
}

/** Evenly sampled points along the full ellipse, for drawing the path. */
export function sampleOrbitPath(
  elements: OrbitElements,
  segments: number,
): Float32Array {
  const points = new Float32Array((segments + 1) * 3)
  const point: MutableVector3 = { x: 0, y: 0, z: 0 }
  for (let i = 0; i <= segments; i += 1) {
    positionFromEccentricAnomaly(elements, (i / segments) * TWO_PI, point)
    points[i * 3] = point.x
    points[i * 3 + 1] = point.y
    points[i * 3 + 2] = point.z
  }
  return points
}

/** Largest distance any point of the orbit reaches from the sun. */
export function orbitApoapsis(elements: OrbitElements): number {
  return elements.semiMajorAxis * (1 + elements.eccentricity)
}
