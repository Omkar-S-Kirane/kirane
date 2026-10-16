import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import { Hero } from './Hero'

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
})
