import { useEffect, useRef } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import './MetricCard.css'

export interface MetricCardProps {
  value: string
  label: string
  detail?: string
  scrollProgress?: number
  scrollFactor?: number
}

interface PointerPosition {
  x: number
  y: number
}

export function MetricCard({
  value,
  label,
  detail,
  scrollProgress = 0,
  scrollFactor = 1,
}: MetricCardProps) {
  const frameRef = useRef<number | null>(null)
  const pendingPositionRef = useRef<PointerPosition | null>(null)

  const scheduleTransform = (card: HTMLElement, position: PointerPosition) => {
    pendingPositionRef.current = position
    if (frameRef.current !== null) return

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null
      const nextPosition = pendingPositionRef.current
      pendingPositionRef.current = null
      if (!nextPosition) return

      const { x, y } = nextPosition
      card.style.setProperty('--metric-tilt-x', `${-y * 4}deg`)
      card.style.setProperty('--metric-tilt-y', `${x * 4}deg`)
      card.style.setProperty('--metric-surface-x', `${x * 4}px`)
      card.style.setProperty('--metric-surface-y', `${y * 4}px`)
      for (const [depth, strength] of [9, 6, -2].entries()) {
        card.style.setProperty(
          `--metric-depth-${depth + 1}-x`,
          `${x * -strength}px`,
        )
        card.style.setProperty(
          `--metric-depth-${depth + 1}-y`,
          `${y * -strength}px`,
        )
      }
    })
  }

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    },
    [],
  )

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const mediaQueriesSupported = typeof window.matchMedia === 'function'
    if (
      event.pointerType !== 'mouse' ||
      !mediaQueriesSupported ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const card = event.currentTarget
    const bounds = card.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return

    const x = Math.max(
      -0.5,
      Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5),
    )
    const y = Math.max(
      -0.5,
      Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5),
    )
    scheduleTransform(card, { x, y })
  }

  const resetPointer = (event: PointerEvent<HTMLElement>) => {
    scheduleTransform(event.currentTarget, { x: 0, y: 0 })
  }

  const scrollOffset = scrollProgress * scrollFactor * 30
  const scrollStyle = {
    '--metric-scroll-surface-x': `${scrollProgress * scrollFactor * 2}px`,
    '--metric-scroll-surface-y': `${scrollOffset * 0.12}px`,
    '--metric-scroll-depth-1-x': `${-scrollProgress * scrollFactor * 5}px`,
    '--metric-scroll-depth-1-y': `${scrollOffset}px`,
    '--metric-scroll-depth-2-x': `${scrollProgress * scrollFactor * 3}px`,
    '--metric-scroll-depth-2-y': `${scrollOffset * 0.62}px`,
    '--metric-scroll-depth-3-x': `${-scrollProgress * scrollFactor * 1.5}px`,
    '--metric-scroll-depth-3-y': `${scrollOffset * 0.24}px`,
  } as CSSProperties

  return (
    <article
      className="metric-card"
      style={scrollStyle}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
      aria-label={`${value} ${label}`}
    >
      <span
        className="metric-card__backplate metric-card__backplate--far"
        data-parallax-depth="1"
        aria-hidden="true"
      />
      <span
        className="metric-card__backplate metric-card__backplate--near"
        data-parallax-depth="2"
        aria-hidden="true"
      />
      <div className="metric-card__content" data-parallax-depth="3">
        <p className="metric-card__value" aria-hidden="true">
          {value}
        </p>
        <h3 className="metric-card__label">{label}</h3>
        {detail && <p className="metric-card__detail">{detail}</p>}
      </div>
    </article>
  )
}
