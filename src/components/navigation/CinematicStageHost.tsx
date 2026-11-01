import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from 'motion/react'
import { EngineeringImpact } from '@/sections/EngineeringImpact'
import {
  PortfolioStageContent,
  PORTFOLIO_STAGE_IDS,
} from '@/sections/PortfolioSections/PortfolioStageContent'
import type { PortfolioStageId } from '@/sections/PortfolioSections/PortfolioStageContent'
import { UniverseSection } from '@/sections/Universe'
import { useTranslation } from '@/i18n'
import type { CinematicStageId } from '@/hooks/use-cinematic-navigation'
import './CinematicStageHost.css'

interface CinematicStageHostProps {
  activeStage: CinematicStageId
  onTransitionComplete: () => void
  onOpenResume?: () => void
}

function isPortfolioStage(stage: CinematicStageId): stage is PortfolioStageId {
  return PORTFOLIO_STAGE_IDS.includes(stage as PortfolioStageId)
}

function StagePanel({
  stage,
  label,
  reducedMotion,
  onTransitionComplete,
  onOpenResume,
}: {
  stage: Exclude<CinematicStageId, 'home'>
  label: string
  reducedMotion: boolean
  onTransitionComplete: () => void
  onOpenResume?: () => void
}) {
  const isPresent = useIsPresent()
  const content =
    stage === 'universe' ? (
      <UniverseSection />
    ) : stage === 'impact' ? (
      <EngineeringImpact />
    ) : isPortfolioStage(stage) ? (
      <PortfolioStageContent stage={stage} onOpenResume={onOpenResume} />
    ) : null

  return (
    <motion.div
      role="region"
      aria-label={label}
      aria-live="polite"
      aria-hidden={!isPresent}
      inert={!isPresent}
      tabIndex={-1}
      data-testid="active-stage-panel"
      data-stage-panel={isPresent ? 'active' : 'inactive'}
      data-reduced-motion={reducedMotion}
      data-transition-duration={reducedMotion ? '0' : '280'}
      data-stage={stage}
      style={{ pointerEvents: stage === 'universe' ? 'none' : 'auto' }}
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: reducedMotion ? 0 : 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
      onAnimationComplete={() => {
        if (isPresent) onTransitionComplete()
      }}
      className="cinematic-stage-host__panel"
    >
      {content}
    </motion.div>
  )
}

export function CinematicStageHost({
  activeStage,
  onTransitionComplete,
  onOpenResume,
}: CinematicStageHostProps) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion() === true

  const stageLabel =
    activeStage === 'universe'
      ? t.universe.sceneLabel
      : activeStage === 'impact'
        ? t.portfolio.impactHeading
        : activeStage === 'work'
          ? t.portfolio.workHeading
          : activeStage === 'experience'
            ? t.portfolio.experienceHeading
            : activeStage === 'skills'
              ? t.portfolio.skillsHeading
              : activeStage === 'resume'
                ? t.resume.modalTitle
                : activeStage === 'contact'
                  ? t.portfolio.contactHeading
                  : undefined

  return (
    <div
      className="cinematic-stage-host"
      data-testid="cinematic-stage-host"
      data-active-stage={activeStage}
      aria-live="off"
    >
      <AnimatePresence initial={false} mode="wait">
        {activeStage !== 'home' && stageLabel && (
          <StagePanel
            key={activeStage}
            stage={activeStage}
            label={stageLabel}
            reducedMotion={reducedMotion}
            onTransitionComplete={onTransitionComplete}
            onOpenResume={onOpenResume}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
