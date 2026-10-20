import type { ResumeData } from '@/data/resume'
import { useTranslation } from '@/i18n/useTranslation'

import { CVHeader } from './CVHeader'
import { CVSection } from './CVSection'

interface CVDocumentProps {
  data: ResumeData
}

/**
 * Full CV document — pixel-accurate reproduction of the original 3-page
 * PDF, rendered entirely from HTML/CSS. The data prop carries the
 * locale-resolved resume content; UI chrome strings come from i18n.
 */
export function CVDocument({ data }: CVDocumentProps) {
  const { t } = useTranslation()
  const r = t.resume

  return (
    <article className="cv-document" aria-label={r.resumeDocument}>
      {/* ── Page 1 ─────────────────────────────────────────────── */}
      <div
        className="cv-page"
        aria-label={r.pageOf.replace('{current}', '1').replace('{total}', '3')}
      >
        <CVHeader personalInfo={data.personalInfo} />

        <CVSection title={r.professionalSummary} id="cv-summary">
          <p className="cv-paragraph">{data.professionalSummary}</p>
        </CVSection>

        <CVSection title={r.experience} id="cv-experience">
          {data.experience.map((entry) => (
            <div key={`${entry.company}-${entry.period}`} className="cv-entry">
              <div className="cv-entry__header">
                <div className="cv-entry__left">
                  <span className="cv-entry__company">{entry.company}</span>
                  <span className="cv-entry__sep">, </span>
                  <span className="cv-entry__location">{entry.location}</span>
                </div>
                <div className="cv-entry__right">
                  <span className="cv-entry__period">{entry.period}</span>
                </div>
              </div>
              <div className="cv-entry__title">{entry.title}</div>
              <ul className="cv-bullets">
                {entry.bullets.map((bullet) => (
                  <li key={bullet} className="cv-bullets__item">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CVSection>
      </div>

      {/* ── Page 2 ─────────────────────────────────────────────── */}
      <div
        className="cv-page"
        aria-label={r.pageOf.replace('{current}', '2').replace('{total}', '3')}
      >
        <CVSection title={r.education} id="cv-education">
          {data.education.map((entry) => (
            <div
              key={`${entry.institution}-${entry.period}`}
              className="cv-entry"
            >
              <div className="cv-entry__header">
                <div className="cv-entry__left">
                  <span className="cv-entry__company">{entry.institution}</span>
                  <span className="cv-entry__sep">, </span>
                  <span className="cv-entry__location">{entry.location}</span>
                </div>
                <div className="cv-entry__right">
                  <span className="cv-entry__period">{entry.period}</span>
                </div>
              </div>
              <div className="cv-entry__title">
                {entry.degree}
                <span className="cv-entry__result"> — {entry.result}</span>
              </div>
            </div>
          ))}
        </CVSection>

        <CVSection title={r.skills} id="cv-skills">
          <table className="cv-skills-table" role="table">
            <tbody>
              {data.skills.map((skill) => (
                <tr key={skill.category} className="cv-skills-table__row">
                  <td className="cv-skills-table__category">
                    {skill.category}
                  </td>
                  <td className="cv-skills-table__items">{skill.items}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CVSection>

        <CVSection title={r.keyContributions} id="cv-contributions">
          {data.contributions.map((group) => (
            <div key={group.company} className="cv-entry">
              <div className="cv-entry__header">
                <span className="cv-entry__company">{group.company}</span>
              </div>
              <ul className="cv-bullets">
                {group.bullets.map((bullet) => (
                  <li key={bullet} className="cv-bullets__item">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CVSection>
      </div>

      {/* ── Page 3 ─────────────────────────────────────────────── */}
      <div
        className="cv-page"
        aria-label={r.pageOf.replace('{current}', '3').replace('{total}', '3')}
      >
        <CVSection title={r.extracurricular} id="cv-extracurricular">
          <ul className="cv-bullets">
            {data.extracurricular.map((entry) => (
              <li key={entry.title} className="cv-bullets__item">
                <strong className="cv-inline-title">{entry.title}:</strong>{' '}
                {entry.description}
              </li>
            ))}
          </ul>
        </CVSection>

        <CVSection title={r.awards} id="cv-awards">
          <ul className="cv-bullets">
            {data.awards.map((entry) => (
              <li key={entry.title} className="cv-bullets__item">
                <strong className="cv-inline-title">{entry.title}:</strong>{' '}
                {entry.description}
              </li>
            ))}
          </ul>
        </CVSection>

        <CVSection title={r.professionalInterests} id="cv-interests">
          <ul className="cv-bullets">
            {data.interests.map((entry) => (
              <li key={entry.title} className="cv-bullets__item">
                <strong className="cv-inline-title">{entry.title}:</strong>{' '}
                {entry.description}
              </li>
            ))}
          </ul>
        </CVSection>
      </div>
    </article>
  )
}
