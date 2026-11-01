import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { resumeData } from '@/data/resume'
import { useTranslation } from '@/i18n'

function tabId(index: number) {
  return `experience-role-tab-${index}`
}

export function ExperienceStage() {
  const { t, language } = useTranslation()
  const resume = resumeData[language]
  const [selectedIndex, setSelectedIndex] = useState(0)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const reduceMotion = useReducedMotion() === true
  const selectedRole = resume.experience[selectedIndex]

  const selectRole = (index: number, moveFocus = false) => {
    const nextIndex =
      (index + resume.experience.length) % resume.experience.length
    setSelectedIndex(nextIndex)
    if (moveFocus) tabRefs.current[nextIndex]?.focus()
  }

  return (
    <section
      id="experience"
      data-page-section
      aria-label={t.portfolio.experienceHeading}
      className="experience-stage portfolio-stage-section"
    >
      <Container
        maxWidth="wide"
        padding="page"
        safeArea
        className="experience-stage__layout portfolio-stage-section__layout"
      >
        <SectionHeading
          eyebrow={t.portfolio.experienceEyebrow}
          title={t.portfolio.experienceHeading}
          description={t.portfolio.experienceDescription}
          className="experience-stage__heading"
        />

        <div
          role="tablist"
          aria-label={t.portfolio.experienceHeading}
          className="experience-stage__selector"
        >
          {resume.experience.map((role, index) => (
            <button
              key={`${role.company}-${role.period}`}
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              id={tabId(index)}
              type="button"
              role="tab"
              aria-label={`${role.title}, ${role.company}`}
              aria-selected={selectedIndex === index}
              aria-controls="experience-role-panel"
              tabIndex={selectedIndex === index ? 0 : -1}
              onClick={() => selectRole(index)}
              onKeyDown={(event) => {
                const nextIndex =
                  event.key === 'ArrowRight' || event.key === 'ArrowDown'
                    ? index + 1
                    : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                      ? index - 1
                      : event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? resume.experience.length - 1
                          : null
                if (nextIndex === null) return
                event.preventDefault()
                selectRole(nextIndex, true)
              }}
              className="experience-stage__tab"
            >
              <span className="experience-stage__tab-title">{role.title}</span>
              <span className="experience-stage__tab-company">
                {role.company}
              </span>
            </button>
          ))}
        </div>

        <label
          className="experience-stage__mobile-selector"
          htmlFor="experience-role-select"
        >
          <span className="sr-only">{t.portfolio.experienceHeading}</span>
          <select
            id="experience-role-select"
            value={selectedIndex}
            onChange={(event) => selectRole(Number(event.currentTarget.value))}
            aria-label={t.portfolio.experienceHeading}
          >
            {resume.experience.map((role, index) => (
              <option key={`${role.company}-${role.period}`} value={index}>
                {role.title} · {role.company}
              </option>
            ))}
          </select>
        </label>

        {selectedRole && (
          <motion.article
            key={`${selectedRole.company}-${selectedRole.period}`}
            id="experience-role-panel"
            role="tabpanel"
            aria-labelledby={tabId(selectedIndex)}
            tabIndex={0}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.24 }}
            className="experience-stage__details"
          >
            <div className="experience-stage__meta">
              <p className="experience-stage__period">{selectedRole.period}</p>
              <h3 className="experience-stage__role-title">
                {selectedRole.title}
              </h3>
              <p className="experience-stage__company">
                {selectedRole.company} · {selectedRole.location}
              </p>
            </div>
            <ul className="experience-stage__bullets">
              {selectedRole.bullets.map((bullet) => (
                <li key={bullet} className="experience-stage__bullet">
                  <span aria-hidden="true" className="experience-stage__dot" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        )}
      </Container>
    </section>
  )
}
