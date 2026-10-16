import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CLICK_COOLDOWN_MS,
  NAVBAR_HEIGHT,
  SECTION_IDS,
} from '@/constants/navbar-constants'

// ---------------------------------------------------------------------------
// useActiveSection — IntersectionObserver-driven active state
// ---------------------------------------------------------------------------

/**
 * Tracks which page section is currently in view and provides a setter
 * for click-driven updates with a cooldown to prevent flicker during
 * smooth scrolling.
 */
export function useActiveSection(): [string | null, (id: string) => void] {
  const [activeId, setActiveId] = useState<string | null>(null)
  const clickCooldownRef = useRef(false)

  /** Called on nav-link click to set active immediately and start cooldown. */
  const setActiveFromClick = useCallback((id: string) => {
    setActiveId(id)
    clickCooldownRef.current = true
    setTimeout(() => {
      clickCooldownRef.current = false
    }, CLICK_COOLDOWN_MS)
  }, [])

  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[]

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (clickCooldownRef.current) return

        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      {
        rootMargin: `-${NAVBAR_HEIGHT + 32}px 0px -40% 0px`,
        threshold: 0,
      },
    )

    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [activeId, setActiveFromClick]
}
