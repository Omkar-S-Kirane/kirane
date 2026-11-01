export const CINEMATIC_SPRING = {
  stiffness: 62,
  damping: 25,
  mass: 0.8,
  restDelta: 0.0005,
} as const

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

/** A bounded per-event step keeps mouse wheels and trackpads predictable. */
export function getWheelProgressDelta(
  deltaY: number,
  deltaMode: number,
  viewportHeight: number,
): number {
  if (!Number.isFinite(deltaY) || deltaY === 0) return 0
  const unit =
    deltaMode === 2 ? Math.max(viewportHeight, 1) : deltaMode === 1 ? 80 : 480
  return Math.max(-0.055, Math.min(0.055, deltaY / unit))
}

export function isVerticalGesture(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaY) >= Math.abs(deltaX)
}

/** Hero remains intact briefly, then dissolves as the east-side sun arrives. */
export function getHeroDissolveProgress(progress: number): number {
  const local = clampProgress((progress - 0.06) / (0.52 - 0.06))
  return local * local * (3 - 2 * local)
}

function hashNoise(index: number, seed: number): number {
  const value = Math.sin(index * 127.1 + seed * 311.7) * 43_758.5453
  return (value - Math.floor(value)) * 2 - 1
}

function smoothNoise(y: number, seed: number): number {
  const coordinate = y * 9
  const cell = Math.floor(coordinate)
  const t = coordinate - cell
  const eased = t * t * (3 - 2 * t)
  return hashNoise(cell, seed) * (1 - eased) + hashNoise(cell + 1, seed) * eased
}

/** Normalized x position of the organic Hero dissolve boundary. */
export function getDissolveBoundary(progress: number, y: number): number {
  const p = clampProgress(progress)
  if (p <= 0) return 100
  if (p >= 1) return 0
  const mean = (1 - p) * 100
  const amplitude = Math.sin(Math.PI * p) * 7.5
  const turbulence =
    Math.sin(y * 17 + p * 8) * 0.48 +
    Math.sin(y * 39 - p * 11) * 0.2 +
    smoothNoise(y, 5) * 0.55
  return Math.max(-4, Math.min(104, mean + amplitude * turbulence))
}

export function getSunTrailTarget(progress: number) {
  const arrival = clampProgress((progress - 0.14) / 0.27)
  const eased = arrival * arrival * (3 - 2 * arrival)
  return { x: 1.04 - 0.54 * eased, y: 0.47 - 0.03 * eased }
}
