import type {
  UniverseLayout,
  UniverseLayoutTier,
  UniverseQuality,
} from './developerUniverse.types'

export const UNIVERSE_PALETTE = {
  background: '#050609',
  sun: '#f5b94c',
  goldenGlow: '#ffcc75',
  secondaryGlow: '#d9a441',
  text: '#f5f2ea',
  sunDeep: '#a85f12',
  sunHot: '#fff4dc',
  orbitGold: '#d9a441',
  orbitIvory: '#e8dcc6',
  starWarm: '#ffd59a',
  starCool: '#cfdcff',
} as const

/**
 * Share of the section's scroll progress used by the universe formation.
 * The remainder reveals the Engineering Impact heading and metric cards.
 */
export const FORMATION_SHARE = 0.85

/** Formation phases, as fractions of the formation progress (0 → 1). */
export const FORMATION_TIMELINE = {
  space: [0, 0.1],
  sunEnter: [0.1, 0.25],
  sunSettle: [0.25, 0.35],
  planets: [0.35, 0.65],
  orbits: [0.65, 0.8],
  activation: [0.8, 0.95],
  interactive: [0.95, 1],
} as const satisfies Record<string, readonly [number, number]>

/** Section progress window in which the impact metrics fade in. */
export const METRICS_REVEAL: readonly [number, number] = [0.86, 0.98]

/** Portion of the planets window each planet takes to arrive. */
export const PLANET_ENTRANCE_DURATION = 0.06

/** Portion of the orbits window each path takes to draw. */
export const ORBIT_DRAW_DURATION = 0.06

/** Orbital speed before the system is activated, relative to full speed. */
export const IDLE_ORBIT_SPEED = 0.25

/** Orbital speed of a hovered or selected planet, relative to full speed. */
export const FOCUSED_ORBIT_SPEED = 0

export const STAR_SEED = 20_260_701

const QUALITY: Record<UniverseLayoutTier, UniverseQuality> = {
  wide: {
    stars: 2600,
    dust: 360,
    sunParticles: 520,
    orbitParticlesPerOrbit: 2,
    sphereSegments: 64,
    maxDpr: 1.75,
  },
  medium: {
    stars: 1600,
    dust: 220,
    sunParticles: 320,
    orbitParticlesPerOrbit: 1,
    sphereSegments: 48,
    maxDpr: 1.5,
  },
  compact: {
    stars: 900,
    dust: 120,
    sunParticles: 200,
    orbitParticlesPerOrbit: 1,
    sphereSegments: 40,
    maxDpr: 1.5,
  },
}

export function createUniverseLayout(
  tier: UniverseLayoutTier,
  coarsePointer: boolean,
  lowPower: boolean,
): UniverseLayout {
  const base = QUALITY[tier]
  const quality: UniverseQuality = lowPower
    ? {
        ...base,
        stars: Math.round(base.stars * 0.6),
        dust: Math.round(base.dust * 0.6),
        sunParticles: Math.round(base.sunParticles * 0.6),
        maxDpr: Math.min(base.maxDpr, 1.25),
      }
    : base

  if (tier === 'compact') {
    return {
      tier,
      coarsePointer,
      quality,
      sunRadius: 1.55,
      planetScale: 1.25,
      hitScale: 2.4,
      fov: 50,
      elevation: 30,
      fitFactor: 1.08,
    }
  }
  if (tier === 'medium') {
    return {
      tier,
      coarsePointer,
      quality,
      sunRadius: 1.85,
      planetScale: 1.1,
      hitScale: coarsePointer ? 2.2 : 1.8,
      fov: 42,
      elevation: 22,
      fitFactor: 0.96,
    }
  }
  return {
    tier,
    coarsePointer,
    quality,
    sunRadius: 2,
    planetScale: 1,
    hitScale: coarsePointer ? 2 : 1.6,
    fov: 38,
    elevation: 19,
    fitFactor: 0.9,
  }
}

/** Compact layouts keep featured planets on evenly spaced, tighter orbits. */
export const COMPACT_ORBIT_RANGE: readonly [number, number] = [2.7, 6.6]
