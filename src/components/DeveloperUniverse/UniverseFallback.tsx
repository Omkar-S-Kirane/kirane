import { motion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { cn } from '@/lib/cn'
import { useTranslation } from '@/i18n'
import type { ScreenCircle } from './developerUniverse.types'
import type { TechnologyPlanet } from './developerUniverse.types'
import { getSunState, segment } from './formationTimeline'
import { TechnologyLogoMark } from './TechnologyLogoMark'

interface UniverseFallbackProps {
  planets: readonly TechnologyPlanet[]
  formation: MotionValue<number>
  activeId: string | null
  onSelect: (id: string) => void
  onHover: (
    id: string | null,
    anchor?: ScreenCircle,
    leavingId?: string,
  ) => void
  interactionEnabled: boolean
  loading?: boolean
}

/**
 * Lightweight universe for devices without WebGL: a CSS sun and the
 * technologies as selectable marks. Shares the scroll timeline and the
 * information card with the 3D experience.
 */
export function UniverseFallback({
  planets,
  formation,
  activeId,
  onSelect,
  onHover,
  interactionEnabled,
  loading = false,
}: UniverseFallbackProps) {
  const { t } = useTranslation()
  const sunOpacity = useTransform(formation, (f) => getSunState(f).form)
  const sunScale = useTransform(
    formation,
    (f) => 0.6 + 0.4 * getSunState(f).scale,
  )
  const planetsOpacity = useTransform(formation, (f) => segment(f, 0.35, 0.65))

  return (
    <div className="universe-fallback">
      {interactionEnabled && !loading && (
        <p className="universe-fallback__notice">{t.universe.fallbackNotice}</p>
      )}
      <motion.div
        className="universe-fallback__sun"
        style={{ opacity: sunOpacity, scale: sunScale }}
        aria-hidden="true"
      >
        <span>{t.universe.sunLineOne}</span>
        <span>{t.universe.sunLineTwo}</span>
      </motion.div>
      {interactionEnabled ? (
        <motion.ul
          className="universe-fallback__planets"
          style={{ opacity: planetsOpacity }}
        >
          {planets.map((planet) => (
            <li key={planet.id}>
              <button
                type="button"
                className={cn(
                  'universe-fallback__planet',
                  activeId === planet.id && 'is-active',
                )}
                aria-pressed={activeId === planet.id}
                onClick={() => onSelect(planet.id)}
                onMouseEnter={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect()
                  onHover(planet.id, {
                    x: bounds.left + bounds.width / 2,
                    y: bounds.top + bounds.height / 2,
                    r: bounds.width / 2,
                  })
                }}
                onMouseLeave={() => onHover(null, undefined, planet.id)}
                onFocus={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect()
                  onHover(planet.id, {
                    x: bounds.left + bounds.width / 2,
                    y: bounds.top + bounds.height / 2,
                    r: bounds.width / 2,
                  })
                }}
                onBlur={() => onHover(null, undefined, planet.id)}
              >
                <TechnologyLogoMark
                  logo={planet.logo}
                  colour={planet.logoColor}
                  className="h-5 w-5"
                />
                <span>{planet.name}</span>
              </button>
            </li>
          ))}
        </motion.ul>
      ) : (
        <motion.div
          className="universe-fallback__ambient-planets"
          style={{ opacity: planetsOpacity }}
          aria-hidden="true"
        >
          {planets.map((planet, index) => {
            const angle = (index / planets.length) * Math.PI * 2
            const left = 50 + Math.cos(angle) * 35
            const top = 50 + Math.sin(angle) * 27
            return (
              <span
                key={planet.id}
                className="universe-fallback__ambient-planet"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  backgroundColor: planet.color,
                  boxShadow: `0 0 12px ${planet.color}`,
                }}
              />
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
