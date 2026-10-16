export interface SphereTransitionFrame {
  rotationMultiplier: number
  scale: number
  offsetX: number
}

const ACCELERATION_WINDOW = 0.28
const SETTLE_START = 0.62
const MAX_ROTATION_MULTIPLIER = 3.4
const MAX_SCALE_EXPANSION = 0.14

function smoothStep(value: number): number {
  const progress = Math.min(1, Math.max(0, value))
  return progress * progress * (3 - 2 * progress)
}

function getHeroOffset(viewportWidth: number): number {
  if (viewportWidth < 640) return 0
  if (viewportWidth < 1024) return 0.45
  return 1
}

export function getSphereTransitionFrame(
  progress: number,
  viewportWidth: number,
  reducedMotion = false,
): SphereTransitionFrame {
  if (reducedMotion) {
    return { rotationMultiplier: 1, scale: 1, offsetX: 0 }
  }

  const clampedProgress = Math.min(1, Math.max(0, progress))
  const acceleration = smoothStep(clampedProgress / ACCELERATION_WINDOW)
  const settling = smoothStep(
    (clampedProgress - SETTLE_START) / (1 - SETTLE_START),
  )
  const rotationMultiplier =
    1 + (MAX_ROTATION_MULTIPLIER - 1) * acceleration * (1 - settling)

  return {
    rotationMultiplier,
    scale: 1 + MAX_SCALE_EXPANSION * Math.sin(Math.PI * clampedProgress),
    offsetX: getHeroOffset(viewportWidth) * smoothStep(clampedProgress),
  }
}
