import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Hero } from '@/sections/Hero'
import { EngineeringImpact } from '@/sections/EngineeringImpact'
import { HeroParticleBridge } from './HeroParticleBridge'
import {
  clampProgress,
  CINEMATIC_SPRING,
  getHeroDissolveProgress,
  getWheelProgressDelta,
  isVerticalGesture,
} from './cinematic-progress'
import './CinematicJourney.css'

export interface CinematicJourneyHandle {
  reset: () => void
  completeForNavigation: () => void
}

interface CinematicJourneyProps {
  initialProgress?: number
  active?: boolean
  fontsReady: boolean
  onLayoutReady: () => void
  onRevealComplete: () => void
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'a, button, input, textarea, select, [contenteditable="true"]',
      ),
    )
  )
}

function isAtJourneyTop(root: HTMLElement | null): boolean {
  if (!root || window.scrollY > 2) return false
  const bounds = root.getBoundingClientRect()
  return bounds.top <= 2 && bounds.bottom > 0
}

export const CinematicJourney = forwardRef<
  CinematicJourneyHandle,
  CinematicJourneyProps
>(function CinematicJourney(
  {
    initialProgress = 0,
    active = true,
    fontsReady,
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
  const universeOpacity = useTransform(progress, (value) =>
    value < 0.015 ? 0 : 1,
  )
  const rootRef = useRef<HTMLElement>(null)
  const navigationReleaseRef = useRef(false)
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)
  const [isComplete, setIsComplete] = useState(start >= 0.999)
  const [isLocked, setIsLocked] = useState(start < 0.999 && !reducedMotion)

  const syncDocumentLock = useCallback(() => {
    const locked =
      !reducedMotion &&
      !navigationReleaseRef.current &&
      progress.get() < 0.999 &&
      isAtJourneyTop(rootRef.current)
    document.documentElement.classList.toggle('cinematic-locked', locked)
    setIsLocked((current) => (current === locked ? current : locked))
  }, [progress, reducedMotion])

  useLayoutEffect(() => {
    syncDocumentLock()
    window.addEventListener('scroll', syncDocumentLock, { passive: true })
    return () => {
      window.removeEventListener('scroll', syncDocumentLock)
      document.documentElement.classList.remove('cinematic-locked')
    }
  }, [syncDocumentLock])

  useMotionValueEvent(progress, 'change', (value) => {
    if (value >= 0.999) navigationReleaseRef.current = false
    setIsComplete(value >= 0.999)
    syncDocumentLock()
  })

  const reset = useCallback(() => {
    navigationReleaseRef.current = false
    targetProgress.set(0)
    requestAnimationFrame(syncDocumentLock)
  }, [syncDocumentLock, targetProgress])

  const completeForNavigation = useCallback(() => {
    navigationReleaseRef.current = true
    targetProgress.set(1)
    document.documentElement.classList.remove('cinematic-locked')
    setIsLocked(false)
  }, [targetProgress])

  useImperativeHandle(forwardedRef, () => ({ reset, completeForNavigation }), [
    completeForNavigation,
    reset,
  ])

  const setProgressFromGesture = useCallback(
    (delta: number, event: { preventDefault: () => void }) => {
      if (!delta || !isAtJourneyTop(rootRef.current)) return
      const current = targetProgress.get()
      const next = reducedMotion
        ? delta > 0
          ? 1
          : 0
        : clampProgress(current + delta)
      const consumed = delta > 0 ? current < 1 : current > 0
      if (!consumed || next === current) return
      event.preventDefault()
      targetProgress.set(next)
    },
    [reducedMotion, targetProgress],
  )

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX))
        return
      const delta = getWheelProgressDelta(
        event.deltaY,
        event.deltaMode,
        window.innerHeight,
      )
      setProgressFromGesture(delta, event)
    },
    [setProgressFromGesture],
  )

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.addEventListener('wheel', handleWheel, { passive: false })
    return () => root.removeEventListener('wheel', handleWheel)
  }, [handleWheel, reducedMotion])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches.length === 1 ? event.touches[0] : undefined
    lastTouchRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }, [])

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      const touch = event.touches.length === 1 ? event.touches[0] : undefined
      const previous = lastTouchRef.current
      if (!touch || !previous) {
        lastTouchRef.current = null
        return
      }
      const deltaX = touch.clientX - previous.x
      const deltaY = previous.y - touch.clientY
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY }
      if (!isVerticalGesture(deltaX, deltaY)) return
      const delta = Math.max(
        -0.045,
        Math.min(0.045, deltaY / Math.max(window.innerHeight, 1)),
      )
      setProgressFromGesture(delta, event)
    },
    [setProgressFromGesture],
  )

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null
  }, [])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.addEventListener('touchstart', handleTouchStart, { passive: true })
    root.addEventListener('touchmove', handleTouchMove, { passive: false })
    root.addEventListener('touchend', handleTouchEnd)
    return () => {
      root.removeEventListener('touchstart', handleTouchStart)
      root.removeEventListener('touchmove', handleTouchMove)
      root.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchEnd, handleTouchMove, handleTouchStart, reducedMotion])

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (isInteractiveTarget(event.target)) return
      const steps: Record<string, number> = {
        ArrowDown: 0.08,
        PageDown: 0.18,
        ' ': event.shiftKey ? -0.12 : 0.12,
        ArrowUp: -0.08,
        PageUp: -0.18,
        Home: -1,
        End: 1,
      }
      const delta = steps[event.key]
      if (delta === undefined) return
      const current = targetProgress.get()
      const next = reducedMotion
        ? delta > 0
          ? 1
          : 0
        : clampProgress(current + delta)
      if (next === current) return
      event.preventDefault()
      targetProgress.set(next)
    },
    [reducedMotion, targetProgress],
  )

  return (
    <section
      ref={rootRef}
      id="home"
      data-page-section
      data-cinematic-journey
      data-testid="cinematic-journey"
      data-active-section={isComplete ? 'impact' : 'home'}
      data-locked={isLocked}
      aria-label="Hero to Developer Universe cinematic transition"
      aria-describedby="cinematic-journey-instructions"
      tabIndex={0}
      className="cinematic-journey"
      onKeyDown={handleKeyDown}
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
      <motion.div
        className="cinematic-journey__universe"
        style={{ opacity: universeOpacity }}
        aria-hidden={false}
      >
        <EngineeringImpact active formationProgress={progress} />
      </motion.div>
    </section>
  )
})
