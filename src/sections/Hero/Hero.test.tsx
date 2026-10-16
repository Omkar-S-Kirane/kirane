import { render } from '@testing-library/react'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import { Hero } from './Hero'

const { reducedMotionMock } = vi.hoisted(() => ({
  reducedMotionMock: vi.fn(() => false as boolean | null),
}))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  return { ...actual, useReducedMotion: reducedMotionMock }
})

beforeEach(() => reducedMotionMock.mockReturnValue(false))

describe('Hero readiness', () => {
  it('measures after critical fonts settle and reports the first layout once', () => {
    const onLayoutReady = vi.fn()
    const onRevealComplete = vi.fn()

    const { rerender } = render(
      <I18nProvider>
        <Hero
          active={false}
          fontsReady={false}
          onLayoutReady={onLayoutReady}
          onRevealComplete={onRevealComplete}
        />
      </I18nProvider>,
    )

    expect(onLayoutReady).not.toHaveBeenCalled()

    rerender(
      <I18nProvider>
        <Hero
          active={false}
          fontsReady
          onLayoutReady={onLayoutReady}
          onRevealComplete={onRevealComplete}
        />
      </I18nProvider>,
    )

    expect(onLayoutReady).toHaveBeenCalledOnce()
    expect(onRevealComplete).not.toHaveBeenCalled()
  })

  it('presents the translated value proposition and working section calls to action', () => {
    render(
      <I18nProvider>
        <Hero
          active
          fontsReady
          onLayoutReady={vi.fn()}
          onRevealComplete={vi.fn()}
        />
      </I18nProvider>,
    )

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Engineering digital\s+experiences that\s+move people\./,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'I build thoughtful, high-performance web experiences with purposeful interactions and attention to detail.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Explore my work/ }),
    ).toHaveAttribute('href', '#work')
    expect(screen.getByRole('link', { name: /Let's connect/ })).toHaveAttribute(
      'href',
      '#contact',
    )
  })

  it('completes its reveal immediately when reduced motion is preferred', () => {
    reducedMotionMock.mockReturnValue(true)
    const onRevealComplete = vi.fn()

    render(
      <I18nProvider>
        <Hero
          active
          fontsReady
          onLayoutReady={vi.fn()}
          onRevealComplete={onRevealComplete}
        />
      </I18nProvider>,
    )

    expect(onRevealComplete).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
    expect(screen.getByRole('link', { name: /Explore my work/ })).toBeVisible()
    expect(screen.getByRole('link', { name: /Let's connect/ })).toBeVisible()
  })
})
