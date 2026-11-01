import {
  FORMATION_SHARE,
  FORMATION_TIMELINE,
  METRICS_REVEAL,
  ORBIT_DRAW_DURATION,
  PLANET_ENTRANCE_DURATION,
} from './developerUniverse.constants'

/**
 * Pure mapping from scroll progress to every stage of the universe
 * formation. Nothing here depends on time, so scrolling backwards replays the
 * same states in reverse.
 */

export function clamp01(value: number): number {
  return value <= 0 ? 0 : value >= 1 ? 1 : value
}

/** Local 0 → 1 progress of `value` within [start, end]. */
export function segment(value: number, start: number, end: number): number {
  if (end <= start) return value >= end ? 1 : 0
  const t = (value - start) / (end - start)
  // Snap floating-point dust so phase boundaries land exactly on 0 and 1.
  if (t >= 1 - 1e-9) return 1
  if (t <= 1e-9) return 0
  return t
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
}

/** Ease-out with a restrained overshoot, used for planets settling into orbit. */
export function easeOutBack(t: number, overshoot = 0.9): number {
  const c3 = overshoot + 1
  return 1 + c3 * (t - 1) ** 3 + overshoot * (t - 1) ** 2
}

/** Converts the section's scroll progress into formation progress. */
export function toFormationProgress(sectionProgress: number): number {
  return clamp01(sectionProgress / FORMATION_SHARE)
}

export interface SpaceState {
  /** Hero backdrop dissolving into deep space (0 = hero, 1 = space). */
  backdrop: number
  /** Global star reveal; each star also has its own threshold. */
  stars: number
  /** Drifting golden dust. */
  dust: number
}

export function getSpaceState(f: number): SpaceState {
  const [start, end] = FORMATION_TIMELINE.space
  return {
    backdrop: easeInOutCubic(segment(f, start, end)),
    stars: segment(f, start, FORMATION_TIMELINE.sunSettle[0]),
    dust: segment(f, 0.05, 0.3),
  }
}

export interface SunState {
  /** Brightness of the small golden light that precedes the sphere. */
  light: number
  /** Travel from the east edge (0) to the centre (1), eased. */
  travel: number
  /** Vertical arc of the travel, eased separately for a gentle rise. */
  rise: number
  /** Scale relative to the final radius. */
  scale: number
  /** Formation of the spherical body. */
  form: number
  /** Rotating surface details and energy waves. */
  detail: number
  /** Atmospheric halo. */
  halo: number
  /** Orbiting golden particles around the sun. */
  particles: number
  /** "Full Stack Developer" typography. */
  text: number
}

export function getSunState(f: number): SunState {
  const [enterStart, enterEnd] = FORMATION_TIMELINE.sunEnter
  const [, settleEnd] = FORMATION_TIMELINE.sunSettle
  return {
    light: segment(f, enterStart - 0.02, enterStart + 0.06),
    travel: easeInOutCubic(segment(f, enterStart, enterEnd + 0.02)),
    rise: easeOutCubic(segment(f, enterStart, enterEnd + 0.04)),
    scale: 0.16 + 0.84 * easeOutCubic(segment(f, enterStart + 0.02, 0.3)),
    form: easeOutCubic(segment(f, enterStart + 0.03, enterEnd + 0.01)),
    detail: segment(f, 0.2, 0.32),
    halo: segment(f, 0.18, 0.33),
    particles: segment(f, 0.22, settleEnd),
    text: easeOutCubic(segment(f, 0.27, settleEnd)),
  }
}

/** Arrival progress (0 → 1) of the planet at `orderIndex` in the formation order. */
export function getPlanetEntrance(
  f: number,
  orderIndex: number,
  count: number,
): number {
  const [start, end] = FORMATION_TIMELINE.planets
  const span = end - start - PLANET_ENTRANCE_DURATION
  const step = count > 1 ? span / (count - 1) : 0
  const from = start + orderIndex * step
  return segment(f, from, from + PLANET_ENTRANCE_DURATION)
}

/** Draw-on progress of an orbit path, from the innermost outwards. */
export function getOrbitDraw(
  f: number,
  orbitIndex: number,
  count: number,
): number {
  const [start, end] = FORMATION_TIMELINE.orbits
  const span = end - start - ORBIT_DRAW_DURATION
  const step = count > 1 ? span / (count - 1) : 0
  const from = start + orbitIndex * step
  return easeInOutCubic(segment(f, from, from + ORBIT_DRAW_DURATION))
}

/** Energy particles travelling along the paths. */
export function getOrbitEnergy(f: number): number {
  return segment(f, 0.7, FORMATION_TIMELINE.activation[0] + 0.05)
}

/** Activation of the solar system: orbital speed ramps to full. */
export function getActivation(f: number): number {
  const [start, end] = FORMATION_TIMELINE.activation
  return easeInOutCubic(segment(f, start, end))
}

export function isInteractive(f: number): boolean {
  return f >= FORMATION_TIMELINE.interactive[0] - 0.001
}

/** Engineering Impact heading and metric cards, driven by section progress. */
export function getMetricsReveal(sectionProgress: number): number {
  return easeOutCubic(
    segment(sectionProgress, METRICS_REVEAL[0], METRICS_REVEAL[1]),
  )
}

/** The "scroll to form" hint fades as soon as the visitor starts scrolling. */
export function getScrollHintOpacity(sectionProgress: number): number {
  return 1 - segment(sectionProgress, 0, 0.035)
}
