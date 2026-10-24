import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  TouchEvent as ReactTouchEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'

export const PAGE_SECTION_IDS = [
  'home',
  'impact',
  'work',
  'experience',
  'skills',
  'contact',
] as const

export type PageSectionId = (typeof PAGE_SECTION_IDS)[number]

const NAVIGATION_LOCK_MS = 850
const WHEEL_THRESHOLD = 60
const WHEEL_GESTURE_RESET_MS = 280
const SWIPE_THRESHOLD = 45

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

export function useSectionNavigation(initialSection?: PageSectionId) {
  const [activeId, setActiveId] = useState<PageSectionId>(
    () => initialSection ?? sectionFromHash(),
  )
  const [scrollDirection, setScrollDirection] = useState<-1 | 1>(1)
  const activeIdRef = useRef(activeId)
  const lastStepAtRef = useRef(0)
  const touchStartYRef = useRef<number | null>(null)
  const wheelGestureActiveRef = useRef(false)
  const wheelDeltaRef = useRef(0)
  const wheelResetTimerRef = useRef<number | null>(null)

  const selectSection = useCallback((id: PageSectionId, replace = false) => {
    const currentIndex = PAGE_SECTION_IDS.indexOf(activeIdRef.current)
    const nextIndex = PAGE_SECTION_IDS.indexOf(id)
    if (nextIndex !== currentIndex) {
      setScrollDirection(nextIndex > currentIndex ? 1 : -1)
    }
    activeIdRef.current = id
    setActiveId(id)
    setHash(id, replace)
  }, [])

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
    (
      event:
        | ReactWheelEvent<HTMLElement>
        | Pick<WheelEvent, 'deltaY' | 'preventDefault'>,
    ) => {
      event.preventDefault()

      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current)
      }
      wheelResetTimerRef.current = window.setTimeout(() => {
        wheelGestureActiveRef.current = false
        wheelDeltaRef.current = 0
        wheelResetTimerRef.current = null
      }, WHEEL_GESTURE_RESET_MS)

      if (wheelGestureActiveRef.current) return
      wheelDeltaRef.current += event.deltaY
      if (Math.abs(wheelDeltaRef.current) < WHEEL_THRESHOLD) return

      wheelGestureActiveRef.current = true
      const direction = wheelDeltaRef.current > 0 ? 1 : -1
      wheelDeltaRef.current = 0
      navigateBy(direction)
    },
    [navigateBy],
  )

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null
    },
    [],
  )

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      const startY = touchStartYRef.current
      const endY = event.changedTouches[0]?.clientY
      touchStartYRef.current = null
      if (startY === null || endY === undefined) return
      const distance = startY - endY
      if (Math.abs(distance) < SWIPE_THRESHOLD) return
      navigateBy(distance > 0 ? 1 : -1)
    },
    [navigateBy],
  )

  useEffect(() => {
    if (initialSection !== undefined) setHash(initialSection, true)
  }, [initialSection])

  useEffect(() => {
    const onPopState = () => {
      const next = sectionFromHash()
      const currentIndex = PAGE_SECTION_IDS.indexOf(activeIdRef.current)
      const nextIndex = PAGE_SECTION_IDS.indexOf(next)
      if (nextIndex !== currentIndex) {
        setScrollDirection(nextIndex > currentIndex ? 1 : -1)
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
  }, [])

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
  }, [navigateBy, navigateTo])

  useEffect(
    () => () => {
      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current)
      }
    },
    [],
  )

  return {
    activeId,
    scrollDirection,
    navigateTo,
    navigateBy,
    handleWheel,
    handleTouchStart,
    handleTouchEnd,
  }
}
