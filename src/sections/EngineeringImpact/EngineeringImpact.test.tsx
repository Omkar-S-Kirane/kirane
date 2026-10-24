import { render, within } from '@testing-library/react'
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

  it('sets the cards to move with the active section scroll direction', () => {
    render(
      <I18nProvider>
        <EngineeringImpact scrollDirection={-1} />
      </I18nProvider>,
    )

    for (const card of within(
      document.getElementById('impact') as HTMLElement,
    ).getAllByRole('article')) {
      expect(card.parentElement).toHaveAttribute('data-parallax-scroll', 'up')
    }
  })
})
