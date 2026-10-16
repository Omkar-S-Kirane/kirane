import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '@/i18n'
import { PortfolioSections } from './PortfolioSections'

describe('PortfolioSections', () => {
  it('provides real destinations for the portfolio navigation', () => {
    render(
      <I18nProvider>
        <PortfolioSections />
      </I18nProvider>,
    )

    for (const id of ['work', 'experience', 'skills', 'contact']) {
      expect(document.getElementById(id)).toBeInTheDocument()
    }
  })

  it('describes the existing portfolio project without invented credentials', () => {
    render(
      <I18nProvider>
        <PortfolioSections />
      </I18nProvider>,
    )

    const work = document.getElementById('work')
    expect(work).not.toBeNull()
    expect(within(work as HTMLElement).getByRole('link')).toHaveAttribute(
      'href',
      'https://github.com/Omkar-S-Kirane/kirane',
    )
    expect(screen.getByText(/ongoing portfolio/i)).toBeInTheDocument()
    expect(
      screen.queryByText(
        /\b\d+\+?\s*(?:years?|clients?|projects?|%)\b|award[- ]winning/i,
      ),
    ).toBeNull()
  })

  it('uses the verified GitHub profile as the contact destination', () => {
    render(
      <I18nProvider>
        <PortfolioSections />
      </I18nProvider>,
    )

    expect(
      screen.getByRole('link', { name: 'Visit GitHub profile' }),
    ).toHaveAttribute('href', 'https://github.com/Omkar-S-Kirane')
  })

  it('lists the technologies used by this project', () => {
    render(
      <I18nProvider>
        <PortfolioSections />
      </I18nProvider>,
    )

    const skills = document.getElementById('skills')
    expect(skills).not.toBeNull()
    for (const skill of ['React', 'TypeScript', 'Motion', 'Three.js']) {
      expect(within(skills as HTMLElement).getByText(skill)).toBeInTheDocument()
    }
  })
})
