import { motion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { cn } from '@/lib/cn'
import { useTranslation } from '@/i18n'
import type { TechnologyPlanet } from './developerUniverse.types'
import { getSunState, segment } from './formationTimeline'
import { TechnologyLogoMark } from './TechnologyLogoMark'

interface UniverseFallbackProps {
  planets: readonly TechnologyPlanet[]
  formation: MotionValue<number>
  activeId: string | null
  onSelect: (id: string) => void
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
      <p className="universe-fallback__notice">{t.universe.fallbackNotice}</p>
      <motion.div
        className="universe-fallback__sun"
        style={{ opacity: sunOpacity, scale: sunScale }}
        aria-hidden="true"
      >
        <span>{t.universe.sunLineOne}</span>
        <span>{t.universe.sunLineTwo}</span>
      </motion.div>
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
    </div>
  )
}
