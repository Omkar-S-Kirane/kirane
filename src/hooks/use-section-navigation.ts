import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  TouchEvent as ReactTouchEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'
import { useMotionValue } from 'motion/react'

export const PAGE_SECTION_IDS = [
  'home',
  'impact',
  'work',
  'experience',
  'skills',
  'contact',
] as const

export type PageSectionId = (typeof PAGE_SECTION_IDS)[number]

/**
 * Sections that turn scroll input into a continuous 0 → 1 progress value
 * before handing off to the neighbouring section. The number is the scroll
 * distance (normalised wheel pixels) needed to travel the full range, so it
 * doubles as the "length" of the scroll-driven sequence.
 */
export const SCRUBBED_SECTION_DISTANCE: Partial<Record<PageSectionId, number>> =
  {
    impact: 2800,
  }

export interface SectionNavigationOptions {
  /**
   * Convert scroll input into section progress for scrubbed sections.
   * Disable for reduced motion: the section then behaves like any other
   * full-screen section and its progress stays at 1.
   */
  scrub?: boolean
}

type WheelInput =
  | ReactWheelEvent<HTMLElement>
  | (Pick<WheelEvent, 'deltaY' | 'preventDefault'> &
      Partial<Pick<WheelEvent, 'deltaMode'>>)

const NAVIGATION_LOCK_MS = 850
const WHEEL_THRESHOLD = 60
const WHEEL_GESTURE_RESET_MS = 280
const SCROLL_PROGRESS_RESET_MS = 900
const SWIPE_THRESHOLD = 45
const WHEEL_LINE_HEIGHT_PX = 16
/** Finger travel is shorter than wheel travel; amplify it for scrubbing. */
const TOUCH_SCRUB_GAIN = 2.4
const TOUCH_AXIS_LOCK_PX = 8
const KEY_SCRUB_STEP = 0.1
const KEY_SCRUB_PAGE_STEP = 0.2

function sectionFromHash(): PageSectionId {
  const id = window.location.hash.slice(1)
  return PAGE_SECTION_IDS.includes(id as PageSectionId)
    ? (id as PageSectionId)
    : 'home'
}

function setHash(id: PageSectionId, replace = false) {
  const url = new URL(window.location.href)
  url.hash = id === 'home' ? '' : id
  window.history[replace ? 'replaceState' : 'pushState'](null, '', url)
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.matches(
        'input, textarea, select, button, a[href], [role="button"]',
      ))
  )
}

/** Converts line- and page-based wheel deltas (Firefox) into pixels. */
export function normalizeWheelDelta(event: WheelInput): number {
  const mode = event.deltaMode ?? 0
  if (mode === 1) return event.deltaY * WHEEL_LINE_HEIGHT_PX
  if (mode === 2) return event.deltaY * window.innerHeight
  return event.deltaY
}

export function useSectionNavigation(
  initialSection?: PageSectionId,
  { scrub = true }: SectionNavigationOptions = {},
) {
  const [activeId, setActiveId] = useState<PageSectionId>(
    () => initialSection ?? sectionFromHash(),
  )
  const [scrollDirection, setScrollDirection] = useState<-1 | 1>(1)
  const [scrollProgress, setScrollProgress] = useState(0)
  /** Continuous progress through the active scrubbed section (0 → 1). */
  const sectionProgress = useMotionValue(scrub ? 0 : 1)
  const activeIdRef = useRef(activeId)
  const scrubEnabledRef = useRef(scrub)
  const lastStepAtRef = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchLastYRef = useRef(0)
  const touchAxisRef = useRef<'x' | 'y' | null>(null)
  const touchScrubbedRef = useRef(false)
  const wheelGestureActiveRef = useRef(false)
  const scrubBoundaryHoldRef = useRef(false)
  const wheelDeltaRef = useRef(0)
  const wheelResetTimerRef = useRef<number | null>(null)
  const scrollProgressResetTimerRef = useRef<number | null>(null)

  useEffect(() => {
    scrubEnabledRef.current = scrub
    if (!scrub) sectionProgress.set(1)
  }, [scrub, sectionProgress])

  const scrubDistanceFor = useCallback(
    (id: PageSectionId): number | undefined =>
      scrubEnabledRef.current ? SCRUBBED_SECTION_DISTANCE[id] : undefined,
    [],
  )

  /**
   * Moves the scrubbed section's progress. Returns the new value, or null
   * when progress is already resting on the boundary in that direction (the
   * input should then fall through to normal section navigation).
   */
  const scrubBy = useCallback(
    (amount: number): number | null => {
      const current = sectionProgress.get()
      if (
        amount === 0 ||
        (amount > 0 && current >= 1) ||
        (amount < 0 && current <= 0)
      ) {
        return null
      }
      const raw = current + amount
      // Snap floating-point residue so the ends are reached exactly.
      const next = raw <= 1e-6 ? 0 : raw >= 1 - 1e-6 ? 1 : raw
      sectionProgress.set(next)
      return next
    },
    [sectionProgress],
  )

  /** Entering from above starts the sequence; entering from below shows it complete. */
  const resetProgressForEntry = useCallback(
    (id: PageSectionId, forward: boolean) => {
      if (SCRUBBED_SECTION_DISTANCE[id] === undefined) return
      sectionProgress.set(scrubEnabledRef.current && forward ? 0 : 1)
    },
    [sectionProgress],
  )

  const selectSection = useCallback(
    (id: PageSectionId, replace = false) => {
      const currentIndex = PAGE_SECTION_IDS.indexOf(activeIdRef.current)
      const nextIndex = PAGE_SECTION_IDS.indexOf(id)
      if (nextIndex !== currentIndex) {
        setScrollDirection(nextIndex > currentIndex ? 1 : -1)
        resetProgressForEntry(id, nextIndex > currentIndex)
      }
      activeIdRef.current = id
      setActiveId(id)
      setHash(id, replace)
    },
    [resetProgressForEntry],
  )

  const navigateTo = useCallback(
    (id: string) => {
      if (!PAGE_SECTION_IDS.includes(id as PageSectionId)) return
      selectSection(id as PageSectionId)
    },
    [selectSection],
  )

  const navigateBy = useCallback(
    (direction: -1 | 1) => {
      const now = Date.now()
      if (now - lastStepAtRef.current < NAVIGATION_LOCK_MS) return
      lastStepAtRef.current = now

      const currentIndex = PAGE_SECTION_IDS.indexOf(activeIdRef.current)
      const nextIndex = Math.min(
        PAGE_SECTION_IDS.length - 1,
        Math.max(0, currentIndex + direction),
      )
      const next = PAGE_SECTION_IDS[nextIndex]
      if (next !== activeIdRef.current) selectSection(next)
    },
    [selectSection],
  )

  const handleWheel = useCallback(
    (event: WheelInput) => {
      event.preventDefault()
      const deltaY = normalizeWheelDelta(event)

      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current)
      }
      wheelResetTimerRef.current = window.setTimeout(() => {
        wheelGestureActiveRef.current = false
        scrubBoundaryHoldRef.current = false
        wheelDeltaRef.current = 0
        wheelResetTimerRef.current = null
      }, WHEEL_GESTURE_RESET_MS)

      if (scrollProgressResetTimerRef.current !== null) {
        window.clearTimeout(scrollProgressResetTimerRef.current)
      }
      scrollProgressResetTimerRef.current = window.setTimeout(() => {
        scrollProgressResetTimerRef.current = null
        setScrollProgress(0)
      }, SCROLL_PROGRESS_RESET_MS)

      if (wheelGestureActiveRef.current) return

      const scrubDistance = scrubDistanceFor(activeIdRef.current)
      if (scrubDistance !== undefined) {
        const next = scrubBy(deltaY / scrubDistance)
        if (next !== null) {
          wheelDeltaRef.current = 0
          // A gesture (including trackpad inertia) that reaches either end
          // rests there; only a fresh gesture may leave the section.
          if (next === 0 || next === 1) scrubBoundaryHoldRef.current = true
          return
        }
        if (scrubBoundaryHoldRef.current) return
      }

      wheelDeltaRef.current += deltaY
      setScrollProgress(
        Math.max(-1, Math.min(1, wheelDeltaRef.current / WHEEL_THRESHOLD)),
      )
      if (Math.abs(wheelDeltaRef.current) < WHEEL_THRESHOLD) return

      wheelGestureActiveRef.current = true
      const direction = wheelDeltaRef.current > 0 ? 1 : -1
      wheelDeltaRef.current = 0
      navigateBy(direction)
    },
    [navigateBy, scrubBy, scrubDistanceFor],
  )

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      const touch = event.touches[0]
      touchStartRef.current = touch
        ? { x: touch.clientX, y: touch.clientY }
        : null
      touchLastYRef.current = touch?.clientY ?? 0
      touchAxisRef.current = null
      touchScrubbedRef.current = false
    },
    [],
  )

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      const touch = event.touches[0]
      const start = touchStartRef.current
      if (!touch || !start) return
      const scrubDistance = scrubDistanceFor(activeIdRef.current)
      if (scrubDistance === undefined) return

      if (touchAxisRef.current === null) {
        const dx = touch.clientX - start.x
        const dy = touch.clientY - start.y
        if (Math.hypot(dx, dy) < TOUCH_AXIS_LOCK_PX) return
        touchAxisRef.current = Math.abs(dy) >= Math.abs(dx) ? 'y' : 'x'
      }
      if (touchAxisRef.current !== 'y') return

      const deltaY = (touchLastYRef.current - touch.clientY) * TOUCH_SCRUB_GAIN
      touchLastYRef.current = touch.clientY
      if (scrubBy(deltaY / scrubDistance) !== null) {
        touchScrubbedRef.current = true
      }
    },
    [scrubBy, scrubDistanceFor],
  )

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      const start = touchStartRef.current
      const endY = event.changedTouches[0]?.clientY
      const axis = touchAxisRef.current
      const scrubbed = touchScrubbedRef.current
      touchStartRef.current = null
      touchAxisRef.current = null
      touchScrubbedRef.current = false
      if (start === null || endY === undefined) return
      // A swipe that moved the scrubbed sequence (or a horizontal drag used
      // to rotate the scene) never doubles as section navigation.
      if (
        scrubDistanceFor(activeIdRef.current) !== undefined &&
        (scrubbed || axis === 'x')
      ) {
        return
      }
      const distance = start.y - endY
      if (Math.abs(distance) < SWIPE_THRESHOLD) return
      const direction = distance > 0 ? 1 : -1
      setScrollProgress(direction)
      if (scrollProgressResetTimerRef.current !== null) {
        window.clearTimeout(scrollProgressResetTimerRef.current)
      }
      scrollProgressResetTimerRef.current = window.setTimeout(() => {
        scrollProgressResetTimerRef.current = null
        setScrollProgress(0)
      }, SCROLL_PROGRESS_RESET_MS)
      navigateBy(direction)
    },
    [navigateBy, scrubDistanceFor],
  )

  useEffect(() => {
    if (initialSection !== undefined) setHash(initialSection, true)
  }, [initialSection])

  useEffect(() => {
    const onPopState = () => {
      const next = sectionFromHash()
      if (scrollProgressResetTimerRef.current !== null) {
        window.clearTimeout(scrollProgressResetTimerRef.current)
        scrollProgressResetTimerRef.current = null
      }
      setScrollProgress(0)
      const currentIndex = PAGE_SECTION_IDS.indexOf(activeIdRef.current)
      const nextIndex = PAGE_SECTION_IDS.indexOf(next)
      if (nextIndex !== currentIndex) {
        setScrollDirection(nextIndex > currentIndex ? 1 : -1)
        resetProgressForEntry(next, nextIndex > currentIndex)
      }
      activeIdRef.current = next
      setActiveId(next)
    }
    window.addEventListener('popstate', onPopState)
    window.addEventListener('hashchange', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('hashchange', onPopState)
    }
  }, [resetProgressForEntry])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        isEditableTarget(event.target) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return

      const direction =
        event.key === 'ArrowDown' ||
        event.key === 'PageDown' ||
        event.key === ' '
          ? 1
          : event.key === 'ArrowUp' || event.key === 'PageUp'
            ? -1
            : 0

      if (direction) {
        event.preventDefault()
        if (scrubDistanceFor(activeIdRef.current) !== undefined) {
          const step =
            event.key === 'PageDown' ||
            event.key === 'PageUp' ||
            event.key === ' '
              ? KEY_SCRUB_PAGE_STEP
              : KEY_SCRUB_STEP
          if (scrubBy(direction * step) !== null) return
        }
        navigateBy(direction)
      } else if (event.key === 'Home') {
        event.preventDefault()
        navigateTo('home')
      } else if (event.key === 'End') {
        event.preventDefault()
        navigateTo('contact')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigateBy, navigateTo, scrubBy, scrubDistanceFor])

  useEffect(
    () => () => {
      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current)
      }
      if (scrollProgressResetTimerRef.current !== null) {
        window.clearTimeout(scrollProgressResetTimerRef.current)
      }
    },
    [],
  )

  return {
    activeId,
    scrollDirection,
    scrollProgress,
    sectionProgress,
    navigateTo,
    navigateBy,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
