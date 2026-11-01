import { render, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import { EngineeringImpact } from './EngineeringImpact'

afterEach(() => {
  vi.useRealTimers()
})

describe('EngineeringImpact', () => {
  it('renders the four source-backed metrics as a separate foreground section', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 1, 12))
    render(
      <I18nProvider>
        <EngineeringImpact />
      </I18nProvider>,
    )

    const section = document.getElementById('impact') as HTMLElement
    expect(
      within(section).getByText('ENGINEERING / IMPACT'),
    ).toBeInTheDocument()
    expect(
      within(section).getByRole('heading', {
        name: 'Experience measured through what I build.',
      }),
    ).toBeInTheDocument()
    expect(within(section).getByText('6.1+')).toBeInTheDocument()
    expect(within(section).getByText('5.0')).toBeInTheDocument()
    expect(within(section).getByText('8+')).toBeInTheDocument()
    expect(within(section).getByText('4')).toBeInTheDocument()
    expect(within(section).getAllByRole('article')).toHaveLength(4)
    expect(section.querySelector('.impact-metrics-grid')).toBeInTheDocument()
    expect(
      within(section).queryByRole('group', { name: /Developer universe/ }),
    ).not.toBeInTheDocument()
  })

  it('keeps metric entrances restrained and staggered', () => {
    render(
      <I18nProvider>
        <EngineeringImpact />
      </I18nProvider>,
    )

    const entries = document.querySelectorAll('[data-entry-direction]')
    expect(
      [...entries].map((entry) => entry.getAttribute('data-entry-direction')),
    ).toEqual(['bottom-left', 'bottom', 'bottom-right', 'top-right'])
    expect(
      document.querySelectorAll('#impact [data-stage-reveal]'),
    ).toHaveLength(5)
  })
})
