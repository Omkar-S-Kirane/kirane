import { useSpring } from 'motion/react'
import type { MotionValue } from 'motion/react'

/**
 * Light smoothing for scroll progress. Wheel and keyboard input arrive in
 * steps; the spring turns them into continuous motion without adding a
 * timeline of its own, so the sequence still follows scroll position exactly
 * once input stops (and reverses when scrolling back).
 */
export const UNIVERSE_PROGRESS_SPRING = {
  stiffness: 85,
  damping: 24,
  mass: 0.7,
  restDelta: 0.0005,
} as const

export function useUniverseProgress(
  sectionProgress: MotionValue<number>,
): MotionValue<number> {
  return useSpring(sectionProgress, UNIVERSE_PROGRESS_SPRING)
}
