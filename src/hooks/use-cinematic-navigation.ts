import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  getWheelProgressDelta,
  isVerticalGesture,
} from '@/sections/CinematicJourney/cinematic-progress'

export const CINEMATIC_STAGE_IDS = [
  'home',
  'universe',
  'impact',
  'work',
  'experience',
  'skills',
  'resume',
  'contact',
] as const

export type CinematicStageId = (typeof CINEMATIC_STAGE_IDS)[number]

export interface CinematicJourneyController {
  adjustProgress: (delta: number) => void
  completeForNavigation: () => void
  reset: () => void
}

const WHEEL_GESTURE_THRESHOLD = 58
const GESTURE_QUIET_PERIOD_MS = 180
const MIN_TOUCH_DISTANCE = 46

function stageFromHash(): CinematicStageId {
  const id = window.location.hash.slice(1)
  return CINEMATIC_STAGE_IDS.includes(id as CinematicStageId)
    ? (id as CinematicStageId)
    : 'home'
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'a, button, input, textarea, select, [contenteditable="true"], [role="button"], [data-gesture-ignore]',
      ),
    )
  )
}

function writeStageHash(stage: CinematicStageId, replace = false) {
  const url = new URL(window.location.href)
  url.hash = stage === 'home' ? '' : stage
  window.history[replace ? 'replaceState' : 'pushState'](null, '', url)
}

function stageAtOffset(
  stage: CinematicStageId,
  offset: number,
): CinematicStageId {
  const current = CINEMATIC_STAGE_IDS.indexOf(stage)
  return CINEMATIC_STAGE_IDS[
    Math.max(0, Math.min(CINEMATIC_STAGE_IDS.length - 1, current + offset))
  ]
}

interface TouchOrigin {
  x: number
  y: number
  startX: number
  startY: number
  target: EventTarget | null
  horizontal: boolean
}

/** One owner for stage order, gestures, browser history, and Hero handoff. */
export function useCinematicNavigation(
  journeyRef: RefObject<CinematicJourneyController | null>,
  initialStage?: CinematicStageId,
) {
  const [activeStage, setActiveStage] = useState<CinematicStageId>(
    () => initialStage ?? stageFromHash(),
  )
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [universeEntered, setUniverseEntered] = useState(
    () => (initialStage ?? stageFromHash()) !== 'home',
  )
  const activeStageRef = useRef(activeStage)
  const transitionRef = useRef(false)
  const heroCompleteRef = useRef(activeStage !== 'home')
  const wheelTotalRef = useRef(0)
  const wheelDisarmedRef = useRef(false)
  const wheelQuietRef = useRef(true)
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchOriginRef = useRef<TouchOrigin | null>(null)
  const touchGestureDisarmedRef = useRef(false)

  const commitStage = useCallback(
    (
      next: CinematicStageId,
      { history = 'push', transitioning = true } = {},
    ) => {
      activeStageRef.current = next
      setActiveStage(next)
      transitionRef.current = transitioning
      setIsTransitioning(transitioning)
      if (history !== 'none') writeStageHash(next, history === 'replace')
    },
    [],
  )

  const finishTransition = useCallback(() => {
    transitionRef.current = false
    setIsTransitioning(false)
    if (wheelQuietRef.current) wheelDisarmedRef.current = false
  }, [])

  const onTransitionComplete = useCallback(() => {
    finishTransition()
  }, [finishTransition])

  const navigateTo = useCallback(
    (stage: CinematicStageId) => {
      const current = activeStageRef.current
      if (current === stage) {
        if (stage === 'universe' && !heroCompleteRef.current) {
          journeyRef.current?.completeForNavigation()
          heroCompleteRef.current = true
        }
        return
      }

      if (stage === 'home') {
        heroCompleteRef.current = false
        setUniverseEntered(false)
        journeyRef.current?.reset()
        commitStage('home')
        return
      }

      if (!heroCompleteRef.current || current === 'home') {
        journeyRef.current?.completeForNavigation()
        heroCompleteRef.current = true
      }
      setUniverseEntered(true)
      commitStage(stage)
    },
    [commitStage, journeyRef],
  )

  const onUniverseEnteredChange = useCallback((entered: boolean) => {
    setUniverseEntered(entered)
  }, [])

  const onHeroTransitionComplete = useCallback(() => {
    heroCompleteRef.current = true
    setUniverseEntered(true)
    wheelDisarmedRef.current = true
    if (touchOriginRef.current) touchGestureDisarmedRef.current = true
    if (activeStageRef.current === 'home') {
      commitStage('universe')
    }
  }, [commitStage])

  const onHeroTransitionReset = useCallback(() => {
    heroCompleteRef.current = false
    setUniverseEntered(false)
    wheelDisarmedRef.current = true
    if (touchOriginRef.current) touchGestureDisarmedRef.current = true
    if (activeStageRef.current === 'universe') {
      commitStage('home')
    } else if (activeStageRef.current === 'home') {
      finishTransition()
    }
  }, [commitStage, finishTransition])

  const beginWheelQuietTimer = useCallback(() => {
    wheelQuietRef.current = false
    if (wheelTimerRef.current !== null) clearTimeout(wheelTimerRef.current)
    wheelTimerRef.current = setTimeout(() => {
      wheelTimerRef.current = null
      wheelQuietRef.current = true
      wheelTotalRef.current = 0
      if (!transitionRef.current) wheelDisarmedRef.current = false
    }, GESTURE_QUIET_PERIOD_MS)
  }, [])

  const stepFromWheel = useCallback(
    (direction: -1 | 1) => {
      if (transitionRef.current) return
      const current = activeStageRef.current
      if (current === 'universe' && direction < 0 && heroCompleteRef.current) {
        heroCompleteRef.current = false
        journeyRef.current?.adjustProgress(-0.055)
        return
      }
      const next = stageAtOffset(current, direction)
      if (next !== current) {
        wheelDisarmedRef.current = true
        navigateTo(next)
      }
    },
    [journeyRef, navigateTo],
  )

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        isInteractiveTarget(event.target) ||
        Math.abs(event.deltaY) < Math.abs(event.deltaX) ||
        event.deltaY === 0
      ) {
        return
      }

      beginWheelQuietTimer()
      const delta = getWheelProgressDelta(
        event.deltaY,
        event.deltaMode,
        window.innerHeight,
      )
      const current = activeStageRef.current

      if (
        current === 'home' ||
        (current === 'universe' && !heroCompleteRef.current)
      ) {
        event.preventDefault()
        journeyRef.current?.adjustProgress(delta)
        return
      }

      event.preventDefault()
      if (wheelDisarmedRef.current || transitionRef.current) return
      wheelTotalRef.current +=
        event.deltaMode === 1
          ? event.deltaY * 80
          : event.deltaMode === 2
            ? event.deltaY * Math.max(window.innerHeight, 1)
            : event.deltaY
      if (Math.abs(wheelTotalRef.current) < WHEEL_GESTURE_THRESHOLD) return
      stepFromWheel(wheelTotalRef.current > 0 ? 1 : -1)
    },
    [beginWheelQuietTimer, journeyRef, stepFromWheel],
  )

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches.length === 1 ? event.touches[0] : undefined
    touchOriginRef.current = touch
      ? {
          x: touch.clientX,
          y: touch.clientY,
          startX: touch.clientX,
          startY: touch.clientY,
          target: event.target,
          horizontal: false,
        }
      : null
    touchGestureDisarmedRef.current = false
  }, [])

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      const touch = event.touches.length === 1 ? event.touches[0] : undefined
      const origin = touchOriginRef.current
      if (!touch || !origin || isInteractiveTarget(origin.target)) return
      const deltaX = touch.clientX - origin.startX
      const deltaY = origin.startY - touch.clientY
      if (!isVerticalGesture(deltaX, deltaY)) {
        origin.horizontal = true
        return
      }
      if (Math.abs(deltaY) < MIN_TOUCH_DISTANCE) return
      event.preventDefault()
      if (origin.horizontal || touchGestureDisarmedRef.current) return

      const current = activeStageRef.current
      const movementY = origin.y - touch.clientY
      const progressDelta = Math.max(
        -0.12,
        Math.min(0.12, movementY / Math.max(window.innerHeight, 1)),
      )
      if (
        current === 'home' ||
        (current === 'universe' && (!heroCompleteRef.current || deltaY < 0))
      ) {
        if (
          current === 'universe' &&
          heroCompleteRef.current &&
          progressDelta < 0
        ) {
          heroCompleteRef.current = false
        }
        journeyRef.current?.adjustProgress(progressDelta)
      } else if (current !== 'universe' || deltaY > 0) {
        if (!transitionRef.current) {
          touchGestureDisarmedRef.current = true
          stepFromWheel(deltaY > 0 ? 1 : -1)
        }
      }
      origin.x = touch.clientX
      origin.y = touch.clientY
    },
    [journeyRef, stepFromWheel],
  )

  const handleTouchEnd = useCallback((_event?: TouchEvent) => {
    touchOriginRef.current = null
    touchGestureDisarmedRef.current = false
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return
      const current = activeStageRef.current
      const direction =
        event.key === 'ArrowDown' ||
        event.key === 'PageDown' ||
        event.key === ' '
          ? 1
          : event.key === 'ArrowUp' || event.key === 'PageUp'
            ? -1
            : 0
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        navigateTo(event.key === 'Home' ? 'home' : 'contact')
        return
      }
      if (!direction) return
      event.preventDefault()
      if (current === 'home' && direction > 0) {
        journeyRef.current?.completeForNavigation()
        heroCompleteRef.current = true
        commitStage('universe')
        return
      }
      if (current === 'universe' && direction < 0 && heroCompleteRef.current) {
        heroCompleteRef.current = false
        journeyRef.current?.reset()
        return
      }
      if (transitionRef.current) return
      const next = stageAtOffset(current, direction)
      if (next !== current) navigateTo(next)
    },
    [commitStage, journeyRef, navigateTo],
  )

  useEffect(() => {
    if (initialStage) writeStageHash(initialStage, true)
  }, [initialStage])

  useEffect(() => {
    const onPopState = () => {
      const next = stageFromHash()
      if (next === 'home') {
        heroCompleteRef.current = false
        setUniverseEntered(false)
        journeyRef.current?.reset()
      } else {
        heroCompleteRef.current = true
        setUniverseEntered(true)
        journeyRef.current?.completeForNavigation()
      }
      commitStage(next, { history: 'none' })
    }
    window.addEventListener('popstate', onPopState)
    window.addEventListener('hashchange', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('hashchange', onPopState)
      if (wheelTimerRef.current !== null) clearTimeout(wheelTimerRef.current)
    }
  }, [commitStage, journeyRef])

  return {
    activeStage,
    isTransitioning,
    universeEntered,
    navigateTo,
    onTransitionComplete,
    onUniverseEnteredChange,
    onHeroTransitionComplete,
    onHeroTransitionReset,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
  }
}
