import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CVSectionProps {
  /** Section heading text (e.g. "Professional Summary") */
  title: string
  /** Optional landmark id for in-page navigation */
  id?: string
  /** Section body */
  children: ReactNode
  className?: string
}

/**
 * Reusable CV section — renders the ❖-prefixed heading with a horizontal
 * rule divider, matching the original PDF layout.
 */
export function CVSection({ title, id, children, className }: CVSectionProps) {
  return (
    <section id={id} className={cn('cv-section', className)} aria-label={title}>
      <div className="cv-section__heading">
        <span className="cv-section__marker" aria-hidden="true">
          ❖
        </span>
        <h2 className="cv-section__title">{title}</h2>
      </div>
      <hr className="cv-section__rule" aria-hidden="true" />
      <div className="cv-section__body">{children}</div>
    </section>
  )
}
