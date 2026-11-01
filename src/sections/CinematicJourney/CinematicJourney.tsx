import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import { Hero } from '@/sections/Hero'
import { HeroParticleBridge } from './HeroParticleBridge'
import {
  clampProgress,
  CINEMATIC_SPRING,
  getHeroDissolveProgress,
} from './cinematic-progress'
import './CinematicJourney.css'

export interface CinematicJourneyHandle {
  reset: () => void
  completeForNavigation: () => void
  adjustProgress: (delta: number) => void
}

interface CinematicJourneyProps {
  initialProgress?: number
  universeProgress: MotionValue<number>
  active?: boolean
  fontsReady: boolean
  onUniverseEnteredChange?: (entered: boolean) => void
  onHeroTransitionComplete?: () => void
  onHeroTransitionReset?: () => void
  onLayoutReady: () => void
  onRevealComplete: () => void
}

export const CinematicJourney = forwardRef<
  CinematicJourneyHandle,
  CinematicJourneyProps
>(function CinematicJourney(
  {
    initialProgress = 0,
    universeProgress,
    active = true,
    fontsReady,
    onUniverseEnteredChange,
    onHeroTransitionComplete,
    onHeroTransitionReset,
    onLayoutReady,
    onRevealComplete,
  },
  forwardedRef,
) {
  const reducedMotion = useReducedMotion() === true
  const start = clampProgress(initialProgress)
  const targetProgress = useMotionValue(start)
  const springProgress = useSpring(targetProgress, CINEMATIC_SPRING)
  const progress = useTransform(
    reducedMotion ? targetProgress : springProgress,
    clampProgress,
  )
  const heroDissolve = useTransform(progress, getHeroDissolveProgress)
  const universeEnteredRef = useRef(start >= 0.001)
  const heroCompleteRef = useRef(start >= 0.999)
  const [isComplete, setIsComplete] = useState(start >= 0.999)

  useMotionValueEvent(progress, 'change', (value) => {
    universeProgress.set(value)
    const entered = value >= 0.001
    if (universeEnteredRef.current !== entered) {
      universeEnteredRef.current = entered
      onUniverseEnteredChange?.(entered)
    }
    const complete = value >= 0.999
    if (complete !== heroCompleteRef.current) {
      heroCompleteRef.current = complete
      if (complete) onHeroTransitionComplete?.()
      else if (value <= 0.001) onHeroTransitionReset?.()
    }
    setIsComplete(complete)
  })

  useLayoutEffect(() => {
    universeProgress.set(progress.get())
  }, [progress, universeProgress])

  const reset = useCallback(() => {
    targetProgress.set(0)
  }, [targetProgress])

  const completeForNavigation = useCallback(() => {
    targetProgress.set(1)
  }, [targetProgress])

  const adjustProgress = useCallback(
    (delta: number) => {
      if (!Number.isFinite(delta) || delta === 0) return
      targetProgress.set(clampProgress(targetProgress.get() + delta))
    },
    [targetProgress],
  )

  useImperativeHandle(
    forwardedRef,
    () => ({ reset, completeForNavigation, adjustProgress }),
    [adjustProgress, completeForNavigation, reset],
  )

  return (
    <section
      id="home"
      data-page-section
      data-cinematic-journey
      data-testid="cinematic-journey"
      data-active-section={isComplete ? 'universe' : 'home'}
      aria-label="Hero to Developer Universe cinematic transition"
      aria-describedby="cinematic-journey-instructions"
      tabIndex={0}
      className="cinematic-journey"
    >
      <span id="cinematic-journey-instructions" className="sr-only">
        Scroll or use the arrow keys to transform the hero into the Developer
        Universe. Reverse direction to return.
      </span>
      <Hero
        active={active}
        fontsReady={fontsReady}
        onLayoutReady={onLayoutReady}
        onRevealComplete={onRevealComplete}
        dissolveProgress={heroDissolve as MotionValue<number>}
      />
      <HeroParticleBridge progress={progress} />
    </section>
  )
})
