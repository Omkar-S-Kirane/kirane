import type { LanguageCode } from '@/i18n/types'

import type { ResumeData } from './types'
import { resumeEn } from './en'
import { resumeGu } from './gu'
import { resumeHi } from './hi'
import { resumeMr } from './mr'
import { resumeSa } from './sa'

/**
 * Map of every supported language code to its resume dataset.
 * Used by CV components to resolve the active locale's content.
 */
export const resumeData: Record<LanguageCode, ResumeData> = {
  en: resumeEn,
  mr: resumeMr,
  hi: resumeHi,
  sa: resumeSa,
  gu: resumeGu,
}

export type {
  AwardEntry,
  ContributionGroup,
  EducationEntry,
  ExperienceEntry,
  ExtracurricularEntry,
  InterestEntry,
  PersonalInfo,
  ResumeData,
  SkillCategory,
} from './types'
