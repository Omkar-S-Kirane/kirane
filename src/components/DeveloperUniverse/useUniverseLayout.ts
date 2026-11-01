import { useMemo, useSyncExternalStore } from 'react'
import { createUniverseLayout } from './developerUniverse.constants'
import type {
  UniverseLayout,
  UniverseLayoutTier,
} from './developerUniverse.types'

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches,
    () => false,
  )
}

function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const cores = navigator.hardwareConcurrency
  return typeof cores === 'number' && cores > 0 && cores <= 4
}

/** Responsive composition and rendering budget for the current viewport. */
export function useUniverseLayout(): UniverseLayout {
  const compact = useMediaQuery('(max-width: 639px)')
  const medium = useMediaQuery('(max-width: 1023px)')
  const coarsePointer = useMediaQuery('(pointer: coarse)')
  const lowPower = useMemo(() => isLowPowerDevice(), [])
  const tier: UniverseLayoutTier = compact
    ? 'compact'
    : medium
      ? 'medium'
      : 'wide'

  return useMemo(
    () => createUniverseLayout(tier, coarsePointer, lowPower),
    [tier, coarsePointer, lowPower],
  )
}
