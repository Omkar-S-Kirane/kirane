import type { PointerEvent } from 'react'
import './MetricCard.css'

export interface MetricCardProps {
  value: string
  label: string
  detail?: string
}

export function MetricCard({ value, label, detail }: MetricCardProps) {
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return

    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    const card = event.currentTarget
    card.style.setProperty('--metric-tilt-x', `${-y * 7}deg`)
    card.style.setProperty('--metric-tilt-y', `${x * 7}deg`)
    for (const [depth, strength] of [0.55, 1, 1.45].entries()) {
      card.style.setProperty(
        `--metric-depth-${depth + 1}-x`,
        `${x * -18 * strength}px`,
      )
      card.style.setProperty(
        `--metric-depth-${depth + 1}-y`,
        `${y * -18 * strength}px`,
      )
    }
  }

  const resetPointer = (event: PointerEvent<HTMLElement>) => {
    const card = event.currentTarget
    card.style.setProperty('--metric-tilt-x', '0deg')
    card.style.setProperty('--metric-tilt-y', '0deg')
    for (let depth = 1; depth <= 3; depth += 1) {
      card.style.setProperty(`--metric-depth-${depth}-x`, '0px')
      card.style.setProperty(`--metric-depth-${depth}-y`, '0px')
    }
  }

  return (
    <article
      className="metric-card"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
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
