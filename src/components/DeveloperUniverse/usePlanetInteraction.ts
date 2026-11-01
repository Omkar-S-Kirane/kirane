import { useCallback, useState } from 'react'
import type { ScreenCircle } from './developerUniverse.types'

export type CardSide = 'right' | 'left' | 'above' | 'below'

export interface CardPlacement {
  x: number
  y: number
  side: CardSide
}

export interface CardPlacementInput {
  anchor: ScreenCircle
  sun: ScreenCircle
  card: { width: number; height: number }
  viewport: { width: number; height: number }
  insets: { top: number; right: number; bottom: number; left: number }
  gap?: number
  /** Side used on the previous frame; kept while still valid to avoid jumps. */
  previous?: CardSide | null
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

function circleIntersectsRect(circle: ScreenCircle, rect: Rect): boolean {
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width))
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height))
  return (circle.x - nearestX) ** 2 + (circle.y - nearestY) ** 2 < circle.r ** 2
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

/**
 * Places the information card beside the active planet: on the side facing
 * away from the sun when possible, never covering the sun or the planet, and
 * always inside the viewport (minus reserved insets).
 */
export function placeInformationCard({
  anchor,
  sun,
  card,
  viewport,
  insets,
  gap = 18,
  previous = null,
}: CardPlacementInput): CardPlacement {
  const minX = insets.left
  const maxX = viewport.width - insets.right - card.width
  const minY = insets.top
  const maxY = viewport.height - insets.bottom - card.height
  const sunZone: ScreenCircle = { ...sun, r: sun.r * 1.08 }
  const outward: CardSide = anchor.x >= sun.x ? 'right' : 'left'
  const inward: CardSide = outward === 'right' ? 'left' : 'right'
  const vertical: CardSide[] =
    anchor.y >= sun.y ? ['below', 'above'] : ['above', 'below']
  const order: CardSide[] = [outward, ...vertical, inward]
  if (previous) order.unshift(previous)

  const candidate = (side: CardSide): { rect: Rect; fits: boolean } => {
    let x: number
    let y: number
    let fits: boolean
    if (side === 'right' || side === 'left') {
      x =
        side === 'right'
          ? anchor.x + anchor.r + gap
          : anchor.x - anchor.r - gap - card.width
      y = clamp(anchor.y - card.height / 2, minY, maxY)
      fits = x >= minX && x <= maxX
    } else {
      y =
        side === 'below'
          ? anchor.y + anchor.r + gap
          : anchor.y - anchor.r - gap - card.height
      x = clamp(anchor.x - card.width / 2, minX, maxX)
      fits = y >= minY && y <= maxY
    }
    const rect = { x, y, width: card.width, height: card.height }
    return {
      rect,
      fits: fits && !circleIntersectsRect(sunZone, rect),
    }
  }

  for (const side of order) {
    const { rect, fits } = candidate(side)
    if (fits) return { x: rect.x, y: rect.y, side }
  }

  // Nothing fits cleanly (very small screens): keep the outward side and
  // clamp the card fully into the viewport.
  const fallback = candidate(outward).rect
  return {
    x: clamp(fallback.x, minX, maxX),
    y: clamp(fallback.y, minY, maxY),
    side: outward,
  }
}

/**
 * Hover (pointer) and selection (tap, keyboard) state for the planets.
 * Hover wins while present so the card follows the pointer; a selection
 * persists until it is cleared.
 */
export function usePlanetInteraction(enabled: boolean) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const hover = useCallback((id: string | null) => {
    setHoveredId(id)
  }, [])

  const select = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id))
  }, [])

  const focus = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const clear = useCallback(() => {
    setHoveredId(null)
    setSelectedId(null)
  }, [])

  return {
    hoveredId: enabled ? hoveredId : null,
    selectedId: enabled ? selectedId : null,
    activeId: enabled ? (hoveredId ?? selectedId) : null,
    hover,
    select,
    focus,
    clear,
  }
}
