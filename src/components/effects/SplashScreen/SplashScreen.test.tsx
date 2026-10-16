import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import { SplashScreen } from './SplashScreen'

vi.mock('@/components/effects/ParticleSphere', () => ({
  ParticleSphere: () => <canvas data-testid="particle-sphere" />,
}))

afterEach(cleanup)

describe('SplashScreen', () => {
  it('shows the translated brand without owning the persistent particle renderer', () => {
    const onRevealComplete = vi.fn()

    render(
      <I18nProvider>
        <SplashScreen
          exiting={false}
          fontsReady
          onRevealComplete={onRevealComplete}
        />
      </I18nProvider>,
    )

    expect(screen.queryByTestId('particle-sphere')).not.toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'KIRANE | OMKAR' }),
    ).toBeInTheDocument()
    expect(onRevealComplete).not.toHaveBeenCalled()
  })
})
