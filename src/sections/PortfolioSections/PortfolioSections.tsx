import { ArrowUpRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { resumeData } from '@/data/resume'
import { useTranslation } from '@/i18n'
import { ExperienceStage } from './ExperienceStage'
import './PortfolioSections.css'

const REPOSITORY_URL = 'https://github.com/Omkar-S-Kirane/kirane'
const PROFILE_URL = 'https://github.com/Omkar-S-Kirane'

interface PortfolioSectionsProps {
  onOpenResume?: () => void
}

function Reveal({
  children,
  delay = 0,
}: {
  children: ReactNode
  delay?: number
}) {
  const reduceMotion = useReducedMotion() === true
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.45,
        delay: reduceMotion ? 0 : delay,
        ease: [0.33, 1, 0.68, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

export function WorkStage() {
  const { t } = useTranslation()
  return (
    <section
      id="work"
      data-page-section
      aria-label={t.portfolio.workHeading}
      className="portfolio-stage-section"
    >
      <Container
        maxWidth="wide"
        padding="page"
        safeArea
        className="portfolio-stage-section__layout portfolio-work-stage"
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,1fr)] lg:items-end lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={t.portfolio.workEyebrow}
              title={t.portfolio.workHeading}
            />
          </Reveal>

          <Reveal delay={0.08}>
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-3xl border border-border bg-bg-muted/40 p-6 transition-colors duration-300 hover:border-border-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:p-8"
            >
              <div className="flex items-center justify-between gap-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
                  {t.portfolio.projectCategory}
                </p>
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-fg-muted motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:-translate-y-1 motion-safe:group-focus-visible:translate-x-1"
                />
              </div>
              <h3 className="mt-10 text-2xl font-medium tracking-tight text-fg sm:text-3xl">
                {t.portfolio.projectTitle}
              </h3>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-fg-muted">
                {t.portfolio.projectDescription}
              </p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-fg">
                {t.portfolio.sourceLinkLabel}
              </span>
            </a>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

export function SkillsStage() {
  const { t } = useTranslation()
  return (
    <section
      id="skills"
      data-page-section
      aria-label={t.portfolio.skillsHeading}
      className="portfolio-stage-section"
    >
      <Container
        maxWidth="wide"
        padding="page"
        safeArea
        className="portfolio-stage-section__layout portfolio-skills-stage"
      >
        <Reveal>
          <SectionHeading
            eyebrow={t.portfolio.skillsEyebrow}
            title={t.portfolio.skillsHeading}
            description={t.portfolio.skillsDescription}
          />
        </Reveal>
        <Reveal delay={0.08}>
          <ul
            aria-label={t.portfolio.skillsHeading}
            className="portfolio-skills-stage__list flex flex-wrap gap-3"
          >
            {t.portfolio.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-border px-4 py-2.5 text-sm text-fg-muted"
              >
                {skill}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  )
}

export function ResumeStage({ onOpenResume }: PortfolioSectionsProps) {
  const { t, language } = useTranslation()
  const resume = resumeData[language]
  return (
    <section
      id="resume"
      data-page-section
      aria-label={t.resume.modalTitle}
      className="portfolio-stage-section"
    >
      <Container
        maxWidth="wide"
        padding="page"
        safeArea
        className="portfolio-stage-section__layout portfolio-resume-stage"
      >
        <Reveal>
          <SectionHeading
            eyebrow={t.resume.professionalSummary}
            title={resume.personalInfo.fullName}
            description={resume.professionalSummary}
          />
        </Reveal>
        <Reveal delay={0.08}>
          <button
            type="button"
            onClick={onOpenResume}
            className="inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-fg px-5 py-3 text-sm font-medium text-bg transition-colors duration-200 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {t.resume.openResume}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </Reveal>
      </Container>
    </section>
  )
}

export function ContactStage() {
  const { t, language } = useTranslation()
  const resume = resumeData[language]
  return (
    <section
      id="contact"
      data-page-section
      aria-label={t.portfolio.contactHeading}
      className="portfolio-stage-section"
    >
      <Container
        maxWidth="wide"
        padding="page"
        safeArea
        className="portfolio-stage-section__layout portfolio-contact-stage"
      >
        <Reveal>
          <SectionHeading
            eyebrow={t.portfolio.contactEyebrow}
            title={t.portfolio.contactHeading}
            description={t.portfolio.contactDescription}
          />
        </Reveal>
        <Reveal delay={0.08}>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${resume.personalInfo.email}`}
              className="inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-fg px-5 py-3 text-sm font-medium text-bg transition-colors duration-200 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {t.footer.email}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
            <a
              href={resume.personalInfo.linkedInUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 w-fit items-center gap-3 rounded-full border border-border px-5 py-3 text-sm font-medium text-fg transition-colors duration-200 hover:border-border-hover hover:bg-fg/[0.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {t.footer.linkedin}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
            <a
              href={PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 w-fit items-center gap-3 rounded-full border border-border px-5 py-3 text-sm font-medium text-fg transition-colors duration-200 hover:border-border-hover hover:bg-fg/[0.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {t.portfolio.githubLinkLabel}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

export function PortfolioSections({ onOpenResume }: PortfolioSectionsProps) {
  return (
    <div className="pointer-events-auto">
      <WorkStage />
      <ExperienceStage />
      <SkillsStage />
      <ResumeStage onOpenResume={onOpenResume} />
      <ContactStage />
    </div>
  )
}
