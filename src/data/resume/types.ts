// ---------------------------------------------------------------------------
// Resume — Shared type definitions
// ---------------------------------------------------------------------------

/**
 * Personal / contact information displayed in the CV header.
 */
export interface PersonalInfo {
  fullName: string
  phone: string
  email: string
  linkedInUrl: string
  linkedInLabel: string
  portfolioUrl: string
  portfolioLabel: string
  location: string
}

/**
 * A single position within a company.
 */
export interface ExperienceEntry {
  company: string
  location: string
  title: string
  period: string
  bullets: string[]
}

/**
 * A single educational qualification.
 */
export interface EducationEntry {
  institution: string
  location: string
  degree: string
  result: string
  period: string
}

/**
 * A named category of skills with its items.
 */
export interface SkillCategory {
  category: string
  items: string
}

/**
 * Key contributions grouped by company.
 */
export interface ContributionGroup {
  company: string
  bullets: string[]
}

/**
 * A single extracurricular or responsibility entry.
 */
export interface ExtracurricularEntry {
  title: string
  description: string
}

/**
 * An award or recognition entry.
 */
export interface AwardEntry {
  title: string
  description: string
}

/**
 * A professional interest or affiliation entry.
 */
export interface InterestEntry {
  title: string
  description: string
}

/**
 * Complete resume data shape — everything needed to render the CV.
 */
export interface ResumeData {
  personalInfo: PersonalInfo
  professionalSummary: string
  experience: ExperienceEntry[]
  education: EducationEntry[]
  skills: SkillCategory[]
  contributions: ContributionGroup[]
  extracurricular: ExtracurricularEntry[]
  awards: AwardEntry[]
  interests: InterestEntry[]
}
