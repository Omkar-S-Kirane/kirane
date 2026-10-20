import type { PersonalInfo } from '@/data/resume'
import { cn } from '@/lib/cn'

interface CVHeaderProps {
  personalInfo: PersonalInfo
  className?: string
}

/**
 * CV header block — renders the candidate name, contact row, and links
 * matching the original PDF layout: centred name, single-line contact.
 */
export function CVHeader({ personalInfo, className }: CVHeaderProps) {
  const {
    fullName,
    phone,
    email,
    linkedInUrl,
    linkedInLabel,
    portfolioUrl,
    portfolioLabel,
    location,
  } = personalInfo

  return (
    <header className={cn('cv-header', className)}>
      <h1 className="cv-header__name">{fullName}</h1>

      <div
        className="cv-header__contact"
        role="list"
        aria-label="Contact details"
      >
        <span role="listitem">
          <a href={`tel:${phone}`} className="cv-link">
            {phone}
          </a>
        </span>
        <span className="cv-header__sep" aria-hidden="true">
          |
        </span>
        <span role="listitem">
          <a href={`mailto:${email}`} className="cv-link">
            {email}
          </a>
        </span>
        <span className="cv-header__sep" aria-hidden="true">
          |
        </span>
        <span role="listitem">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cv-link"
          >
            {linkedInLabel}
          </a>
        </span>
        <span className="cv-header__sep" aria-hidden="true">
          |
        </span>
        <span role="listitem">
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cv-link"
          >
            {portfolioLabel}
          </a>
        </span>
        <span className="cv-header__sep" aria-hidden="true">
          |
        </span>
        <span role="listitem">{location}</span>
      </div>
    </header>
  )
}
