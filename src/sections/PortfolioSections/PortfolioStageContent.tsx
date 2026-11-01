import type { CinematicStageId } from '@/hooks/use-cinematic-navigation'
import {
  ContactStage,
  ResumeStage,
  SkillsStage,
  WorkStage,
} from './PortfolioSections'
import { ExperienceStage } from './ExperienceStage'

export const PORTFOLIO_STAGE_IDS = [
  'work',
  'experience',
  'skills',
  'resume',
  'contact',
] as const satisfies readonly CinematicStageId[]

export type PortfolioStageId = (typeof PORTFOLIO_STAGE_IDS)[number]

interface PortfolioStageContentProps {
  stage: PortfolioStageId
  onOpenResume?: () => void
}

export function PortfolioStageContent({
  stage,
  onOpenResume,
}: PortfolioStageContentProps) {
  switch (stage) {
    case 'work':
      return <WorkStage />
    case 'experience':
      return <ExperienceStage />
    case 'skills':
      return <SkillsStage />
    case 'resume':
      return <ResumeStage onOpenResume={onOpenResume} />
    case 'contact':
      return <ContactStage />
  }
}
