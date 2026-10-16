import { useReducedMotion } from 'motion/react'
import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// useSpotlight — pointer-tracking via CSS custom property (no re-renders)
// ---------------------------------------------------------------------------

/**
 * Tracks the pointer position across the referenced element and writes
 * `--spotlight-x` and `--spotlight-opacity` as CSS custom properties.
 * Purely imperative — no React state, no re-renders.
 *
 * Disabled when `prefers-reduced-motion` is active.
 */
export function useSpotlight(navRef: React.RefObject<HTMLElement | null>) {
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const el = navRef.current
    if (!el || shouldReduceMotion) return

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      el.style.setProperty('--spotlight-x', `${x}px`)
      el.style.setProperty('--spotlight-opacity', '1')
    }

    const onPointerLeave = () => {
      el.style.setProperty('--spotlight-opacity', '0')
    }

    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerleave', onPointerLeave)

    return () => {
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [navRef, shouldReduceMotion])
}
