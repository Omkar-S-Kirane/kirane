import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import { SplashScreen } from './SplashScreen'

vi.mock('@/components/effects/ParticleSphere', () => ({
  ParticleSphere: () => <canvas data-testid="particle-sphere" />,
}))

afterEach(cleanup)

describe('SplashScreen', () => {
  it('shows the translated brand as accessible SVG text and leaves the splash active', () => {
    const onComplete = vi.fn()

    render(
      <I18nProvider>
        <SplashScreen onComplete={onComplete} />
      </I18nProvider>,
    )

    expect(screen.getByTestId('particle-sphere')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'KIRANE | OMKAR' }),
    ).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })
})
