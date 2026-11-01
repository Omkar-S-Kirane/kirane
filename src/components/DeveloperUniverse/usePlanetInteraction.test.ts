import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  placeInformationCard,
  usePlanetInteraction,
} from './usePlanetInteraction'

const base = {
  sun: { x: 720, y: 450, r: 120 },
  card: { width: 320, height: 300 },
  viewport: { width: 1440, height: 900 },
  insets: { top: 88, right: 16, bottom: 16, left: 16 },
}

function overlapsSun(x: number, y: number) {
  const nearestX = Math.max(x, Math.min(base.sun.x, x + base.card.width))
  const nearestY = Math.max(y, Math.min(base.sun.y, y + base.card.height))
  return Math.hypot(base.sun.x - nearestX, base.sun.y - nearestY) < base.sun.r
}

describe('placeInformationCard', () => {
  it('opens on the side facing away from the sun', () => {
    const right = placeInformationCard({
      ...base,
      anchor: { x: 1000, y: 450, r: 20 },
    })
    expect(right.side).toBe('right')
    expect(right.x).toBeGreaterThan(1000)

    const left = placeInformationCard({
      ...base,
      anchor: { x: 420, y: 450, r: 20 },
    })
    expect(left.side).toBe('left')
    expect(left.x + base.card.width).toBeLessThan(420)
  })

  it('stays inside the viewport and away from the sun near the edges', () => {
    for (const anchor of [
      { x: 1400, y: 120, r: 20 },
      { x: 40, y: 860, r: 20 },
      { x: 900, y: 450, r: 24 },
      { x: 560, y: 300, r: 24 },
    ]) {
      const { x, y } = placeInformationCard({ ...base, anchor })
      expect(x).toBeGreaterThanOrEqual(base.insets.left)
      expect(y).toBeGreaterThanOrEqual(base.insets.top)
      expect(x + base.card.width).toBeLessThanOrEqual(1440 - base.insets.right)
      expect(y + base.card.height).toBeLessThanOrEqual(900 - base.insets.bottom)
      expect(overlapsSun(x, y)).toBe(false)
    }
  })

  it('keeps the previous side while it still fits, to avoid jumping', () => {
    const anchor = { x: 760, y: 820, r: 20 }
    const first = placeInformationCard({ ...base, anchor })
    const again = placeInformationCard({
      ...base,
      anchor: { ...anchor, x: anchor.x + 4 },
      previous: first.side,
    })
    expect(again.side).toBe(first.side)
  })
})

describe('usePlanetInteraction', () => {
  it('shows the hovered planet over a selection and ignores input while disabled', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => usePlanetInteraction(enabled),
      { initialProps: { enabled: false } },
    )
    act(() => result.current.hover('react'))
    expect(result.current.activeId).toBeNull()

    rerender({ enabled: true })
    expect(result.current.activeId).toBe('react')

    act(() => {
      result.current.hover(null)
      result.current.select('git')
    })
    expect(result.current.activeId).toBe('git')

    act(() => result.current.hover('docker'))
    expect(result.current.activeId).toBe('docker')

    act(() => result.current.hover(null))
    expect(result.current.activeId).toBe('git')

    act(() => result.current.select('git'))
    expect(result.current.activeId).toBeNull()
  })
})
