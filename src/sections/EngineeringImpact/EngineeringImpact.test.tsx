import { render, within } from '@testing-library/react'
import { motionValue } from 'motion/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import { EngineeringImpact } from './EngineeringImpact'

describe('EngineeringImpact', () => {
  it('renders the specified heading and all four source-backed metrics', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 25))
    render(
      <I18nProvider>
        <EngineeringImpact />
      </I18nProvider>,
    )

    const section = document.getElementById('impact')
    expect(section).not.toBeNull()
    expect(
      within(section as HTMLElement).getByText('ENGINEERING / IMPACT'),
    ).toBeInTheDocument()
    expect(
      within(section as HTMLElement).getByRole('heading', {
        name: 'Experience measured through what I build.',
      }),
    ).toBeInTheDocument()
    expect(within(section as HTMLElement).getByText('6.0+')).toBeInTheDocument()
    expect(within(section as HTMLElement).getByText('4.9')).toBeInTheDocument()
    expect(within(section as HTMLElement).getByText('8+')).toBeInTheDocument()
    expect(within(section as HTMLElement).getByText('4')).toBeInTheDocument()
    expect(within(section as HTMLElement).getAllByRole('article')).toHaveLength(
      4,
    )
    for (const card of within(section as HTMLElement).getAllByRole('article')) {
      expect(
        card.querySelector('[data-parallax-depth="1"]'),
      ).toBeInTheDocument()
      expect(
        card.querySelector('[data-parallax-depth="2"]'),
      ).toBeInTheDocument()
    }
    vi.useRealTimers()
  })

  it('gives each metric card a distinct, restrained entrance direction', () => {
    render(
      <I18nProvider>
        <EngineeringImpact formationProgress={motionValue(1)} />
      </I18nProvider>,
    )

    const cards = document.querySelectorAll('[data-entry-direction]')
    expect(
      [...cards].map((card) => card.getAttribute('data-entry-direction')),
    ).toEqual(['bottom-left', 'bottom', 'bottom-right', 'top-right'])
  })

  it('hosts the Developer Universe and keeps the heading and metrics', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    render(
      <I18nProvider>
        <EngineeringImpact formationProgress={motionValue(1)} />
      </I18nProvider>,
    )

    const section = document.getElementById('impact') as HTMLElement
    expect(
      within(section).getByRole('group', { name: /Developer universe/ }),
    ).toBeInTheDocument()
    expect(
      within(section).getByRole('heading', {
        name: 'Experience measured through what I build.',
      }),
    ).toBeInTheDocument()
    expect(within(section).getAllByRole('article')).toHaveLength(4)
    expect(
      section.querySelector('.impact-universe__sticky'),
    ).toBeInTheDocument()
    expect(
      section.querySelector('.developer-universe__hero-bridge'),
    ).not.toBeInTheDocument()
    expect(
      section.querySelector('.developer-universe__hint')?.parentElement,
    ).toHaveClass('developer-universe')
    vi.restoreAllMocks()
  })
})
