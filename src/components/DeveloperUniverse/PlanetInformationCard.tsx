import { motion, useIsPresent } from 'motion/react'
import type { MotionValue } from 'motion/react'
import type { Ref } from 'react'
import { Clock3, FolderGit2, Gauge, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTranslation } from '@/i18n'
import type {
  ProficiencyLevel,
  TechnologyPlanet,
} from './developerUniverse.types'
import { TechnologyLogoMark } from './TechnologyLogoMark'

export interface PlanetInformationCardProps {
  planet: TechnologyPlanet
  relatedNames: readonly string[]
  /** Floating cards sit beside the planet; sheets dock to the bottom on phones. */
  mode: 'floating' | 'sheet'
  x?: MotionValue<number>
  y?: MotionValue<number>
  onClose?: () => void
  ref?: Ref<HTMLElement>
}

const PROFICIENCY_KEY: Record<
  ProficiencyLevel,
  'advanced' | 'intermediate' | 'learning'
> = {
  Advanced: 'advanced',
  Intermediate: 'intermediate',
  Learning: 'learning',
}

/** Glass panel describing the hovered or selected technology. */
export function PlanetInformationCard({
  planet,
  relatedNames,
  mode,
  x,
  y,
  onClose,
  ref,
}: PlanetInformationCardProps) {
  const { t } = useTranslation()
  const isPresent = useIsPresent()
  const copy = t.universe
  const years =
    planet.experienceYears === null
      ? null
      : copy.yearsValue.replace('{count}', String(planet.experienceYears))
  const projects =
    planet.projectsCompleted === null
      ? null
      : copy.projectsValue.replace('{count}', String(planet.projectsCompleted))

  const stats = [
    { key: 'experience', icon: Clock3, label: copy.experience, value: years },
    {
      key: 'projects',
      icon: FolderGit2,
      label: copy.projects,
      value: projects,
    },
    {
      key: 'proficiency',
      icon: Gauge,
      label: copy.proficiency,
      value: copy.proficiencyLevels[PROFICIENCY_KEY[planet.proficiency]],
    },
  ]

  return (
    <motion.aside
      ref={ref}
      aria-label={`${copy.selectedPlanet}: ${planet.name}`}
      className={cn(
        'universe-card',
        mode === 'sheet' ? 'universe-card--sheet' : 'universe-card--floating',
      )}
      style={{
        ...(mode === 'floating' ? { x, y } : undefined),
        pointerEvents: mode === 'sheet' && isPresent ? 'auto' : 'none',
      }}
      initial={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{
        opacity: 0,
        scale: 0.97,
        filter: 'blur(4px)',
        pointerEvents: 'none',
        transition: { duration: 0.2, ease: [0.33, 1, 0.68, 1] },
      }}
      transition={{ duration: 0.32, ease: [0.33, 1, 0.68, 1] }}
    >
      <p className="universe-card__eyebrow">
        {copy.selectedPlanet}: <span>{planet.name}</span>
      </p>

      <div className="universe-card__header">
        <span className="universe-card__badge">
          <TechnologyLogoMark
            logo={planet.logo}
            colour={planet.logoColor}
            className="h-6 w-6"
          />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="universe-card__title">{planet.name}</h3>
          <p className="universe-card__category">
            {copy.categories[planet.category]}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            className="universe-card__close"
            aria-label={copy.closeCard}
            onClick={onClose}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      <dl className="universe-card__stats">
        {stats.map(({ key, icon: Icon, label, value }) => (
          <div key={key} className="universe-card__stat">
            <dt>
              <Icon aria-hidden="true" className="h-3 w-3 shrink-0" />
              {label}
            </dt>
            <dd className={cn(value === null && 'universe-card__muted')}>
              {value ?? copy.notSpecified}
            </dd>
          </div>
        ))}
      </dl>

      <div className="universe-card__group">
        <h4>{copy.description}</h4>
        <p className="universe-card__description">{planet.description}</p>
      </div>

      <div className="universe-card__group">
        <h4>{copy.keyExpertise}</h4>
        <ul className="universe-card__skills">
          {planet.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </div>

      {relatedNames.length > 0 && (
        <div className="universe-card__group">
          <h4>{copy.relatedTechnologies}</h4>
          <p className="universe-card__related">{relatedNames.join(', ')}</p>
        </div>
      )}
    </motion.aside>
  )
}
