import { ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useTranslation } from '@/i18n'
import { EngineeringImpact } from '@/sections/EngineeringImpact'

const REPOSITORY_URL = 'https://github.com/Omkar-S-Kirane/kirane'
const PROFILE_URL = 'https://github.com/Omkar-S-Kirane'

export function PortfolioSections({
  activeSection,
  scrollDirection = 1,
}: {
  activeSection?: 'work' | 'experience' | 'skills' | 'impact' | 'contact'
  scrollDirection?: -1 | 1
}) {
  const { t } = useTranslation()
  const visible = (id: NonNullable<typeof activeSection>) =>
    activeSection === undefined || activeSection === id

  return (
    <div className="pointer-events-auto">
      <EngineeringImpact
        active={visible('impact')}
        scrollDirection={scrollDirection}
      />

      <section
        id="work"
        aria-label={t.portfolio.workHeading}
        aria-hidden={!visible('work')}
        inert={!visible('work')}
        hidden={!visible('work')}
        className="flex min-h-svh items-center border-t border-border"
      >
        <Container
          maxWidth="wide"
          padding="page"
          safeArea
          className="py-20 sm:py-28"
        >
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,1fr)] lg:items-end lg:gap-16">
            <SectionHeading
              eyebrow={t.portfolio.workEyebrow}
              title={t.portfolio.workHeading}
            />

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
          </div>
        </Container>
      </section>

      <section
        id="experience"
        aria-label={t.portfolio.experienceHeading}
        aria-hidden={!visible('experience')}
        inert={!visible('experience')}
        hidden={!visible('experience')}
        className="flex min-h-svh items-center border-t border-border"
      >
        <Container
          maxWidth="wide"
          padding="page"
          safeArea
          className="py-20 sm:py-28"
        >
          <SectionHeading
            eyebrow={t.portfolio.experienceEyebrow}
            title={t.portfolio.experienceHeading}
            description={t.portfolio.experienceDescription}
          />
        </Container>
      </section>

      <section
        id="skills"
        aria-label={t.portfolio.skillsHeading}
        aria-hidden={!visible('skills')}
        inert={!visible('skills')}
        hidden={!visible('skills')}
        className="flex min-h-svh items-center border-t border-border"
      >
        <Container
          maxWidth="wide"
          padding="page"
          safeArea
          className="grid gap-10 py-20 sm:py-28 lg:grid-cols-[minmax(0,0.75fr)_minmax(20rem,1fr)] lg:items-center lg:gap-16"
        >
          <SectionHeading
            eyebrow={t.portfolio.skillsEyebrow}
            title={t.portfolio.skillsHeading}
            description={t.portfolio.skillsDescription}
          />
          <ul
            aria-label={t.portfolio.skillsHeading}
            className="flex flex-wrap gap-3"
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
        </Container>
      </section>

      <section
        id="contact"
        aria-label={t.portfolio.contactHeading}
        aria-hidden={!visible('contact')}
        inert={!visible('contact')}
        hidden={!visible('contact')}
        className="flex min-h-svh items-center border-y border-border"
      >
        <Container
          maxWidth="wide"
          padding="page"
          safeArea
          className="grid gap-8 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
        >
          <SectionHeading
            eyebrow={t.portfolio.contactEyebrow}
            title={t.portfolio.contactHeading}
            description={t.portfolio.contactDescription}
          />
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-fg px-5 py-3 text-sm font-medium text-bg transition-colors duration-200 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {t.portfolio.githubLinkLabel}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </Container>
      </section>
    </div>
  )
}
