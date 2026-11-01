import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider, SUPPORTED_CODES, STORAGE_KEY } from '@/i18n'
import { resumeData } from '@/data/resume'
import { PortfolioSections } from './PortfolioSections'
import {
  PORTFOLIO_STAGE_IDS,
  PortfolioStageContent,
} from './PortfolioStageContent'
import { ExperienceStage } from './ExperienceStage'

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY)
})

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
    expect(document.getElementById('resume')).toBeInTheDocument()
    expect(document.getElementById('impact')).not.toBeInTheDocument()
  })

  it('starts the regular page flow with Work after the cinematic journey', () => {
    render(
      <I18nProvider>
        <PortfolioSections />
      </I18nProvider>,
    )

    const sectionIds = Array.from(
      document.querySelectorAll<HTMLElement>('section[id]'),
      (section) => section.id,
    )
    expect(sectionIds[0]).toBe('work')
    expect(sectionIds).not.toContain('impact')
  })

  it('shows the existing localized employment history as a readable timeline', () => {
    render(
      <I18nProvider>
        <PortfolioSections />
      </I18nProvider>,
    )

    const experience = document.getElementById('experience') as HTMLElement
    expect(
      within(experience).getByRole('heading', {
        name: 'Software Engineer - II',
      }),
    ).toBeInTheDocument()
    expect(
      within(experience).getByText(/Crystal Delta · Chennai/),
    ).toBeInTheDocument()
    expect(
      within(experience).getByText('Dec 2025 – Present'),
    ).toBeInTheDocument()
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
      within(work as HTMLElement).queryByText(
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
    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      'mailto:omkarkirane.dev@gmail.com',
    )
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/omkar-kirane',
    )
  })

  it('opens the existing resume modal from the Resume section action', async () => {
    const onOpenResume = vi.fn()
    render(
      <I18nProvider>
        <PortfolioSections onOpenResume={onOpenResume} />
      </I18nProvider>,
    )

    const resume = document.getElementById('resume') as HTMLElement
    expect(
      within(resume).getByText(/Software engineer with 6\+ years/),
    ).toBeInTheDocument()
    within(resume).getByRole('button', { name: 'Open resume' }).click()
    expect(onOpenResume).toHaveBeenCalledOnce()
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

  it('exposes each portfolio destination as an independently renderable stage', () => {
    expect(PORTFOLIO_STAGE_IDS).toEqual([
      'work',
      'experience',
      'skills',
      'resume',
      'contact',
    ])

    for (const stage of PORTFOLIO_STAGE_IDS) {
      const { unmount } = render(
        <I18nProvider>
          <PortfolioStageContent stage={stage} />
        </I18nProvider>,
      )
      expect(document.getElementById(stage)).toBeInTheDocument()
      expect(document.querySelectorAll('section[id]')).toHaveLength(1)
      unmount()
    }
  })

  it('keeps every role and bullet reachable in all supported locales', () => {
    for (const language of SUPPORTED_CODES) {
      localStorage.setItem(STORAGE_KEY, language)
      const { unmount } = render(
        <I18nProvider>
          <ExperienceStage />
        </I18nProvider>,
      )

      const roles = resumeData[language as keyof typeof resumeData].experience
      for (const role of roles) {
        const tab = screen.getByRole('tab', {
          name: `${role.title}, ${role.company}`,
        })
        fireEvent.click(tab)
        const panel = screen.getByRole('tabpanel')
        expect(panel).toHaveTextContent(role.title)
        expect(panel).toHaveTextContent(role.company)
        expect(panel).toHaveTextContent(role.period)
        expect(panel).toHaveTextContent(role.location)
        for (const bullet of role.bullets) {
          expect(within(panel).getByText(bullet)).toBeInTheDocument()
        }
      }
      expect(screen.getAllByRole('tab')).toHaveLength(5)
      unmount()
    }
  })
})
