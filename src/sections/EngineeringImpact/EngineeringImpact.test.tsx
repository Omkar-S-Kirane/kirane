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

  it('sets the cards to move with the active section scroll direction', () => {
    render(
      <I18nProvider>
        <EngineeringImpact scrollDirection={-1} scrollProgress={-0.5} />
      </I18nProvider>,
    )

    const cards = within(
      document.getElementById('impact') as HTMLElement,
    ).getAllByRole('article')
    for (const card of cards) {
      expect(card.closest('.metric-card-scroll-layer')).toHaveAttribute(
        'data-parallax-scroll',
        'up',
      )
    }
    expect(cards[0]).toHaveStyle({ '--metric-scroll-depth-1-y': '-7.5px' })
    expect(cards[3]).toHaveStyle({ '--metric-scroll-depth-1-y': '-18.75px' })
    expect(cards[0].closest('.metric-card-scroll-layer')).toHaveClass(
      'metric-card-scroll-layer',
    )
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
    vi.restoreAllMocks()
  })
})
