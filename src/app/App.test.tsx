import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { Providers } from './providers'

vi.mock('@/components/effects/ParticleSphere', () => ({
  ParticleSphere: ({
    phase,
    onReady,
    onTransitionComplete,
  }: {
    phase: string
    onReady: () => void
    onTransitionComplete: () => void
  }) => (
    <div data-testid="particle-sphere" data-phase={phase}>
      <button type="button" data-testid="renderer-ready" onClick={onReady} />
      {phase === 'transitioning' && (
        <button
          type="button"
          data-testid="sphere-transition-complete"
          onClick={onTransitionComplete}
        />
      )}
    </div>
  ),
}))

vi.mock('@/components/effects/SplashScreen', () => ({
  SplashScreen: ({
    exiting,
    onRevealComplete,
  }: {
    exiting: boolean
    onRevealComplete: () => void
  }) => (
    <div data-testid="splash" data-exiting={exiting}>
      <button
        type="button"
        data-testid="splash-reveal-complete"
        onClick={onRevealComplete}
      />
    </div>
  ),
  shouldShowSplash: () => true,
  markSplashShown: vi.fn(),
}))

vi.mock('@/sections/Hero', () => ({
  Hero: ({
    active,
    onLayoutReady,
    onRevealComplete,
  }: {
    active: boolean
    onLayoutReady: () => void
    onRevealComplete: () => void
  }) => (
    <section data-testid="hero" data-active={active}>
      <button
        type="button"
        data-testid="hero-layout-ready"
        onClick={onLayoutReady}
      />
      <button
        type="button"
        data-testid="hero-reveal-complete"
        onClick={onRevealComplete}
      />
    </section>
  ),
}))

vi.mock('@/sections/PortfolioSections', () => ({
  PortfolioSections: () => <div data-testid="portfolio-sections" />,
}))

vi.mock('@/components/effects/StardustCursor', () => ({
  StardustCursor: () => <div data-testid="stardust-cursor" />,
}))

vi.mock('@/components/layout/Navbar', () => ({
  Navbar: () => <nav data-testid="navbar" />,
}))

vi.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer data-testid="footer" />,
}))

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('App splash lifecycle', () => {
  it('reveals the main screen beneath the fading splash before removing it', async () => {
    vi.useFakeTimers()
    render(
      <Providers>
        <App />
      </Providers>,
    )

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByTestId('app-shell')).toHaveAttribute('inert')
    fireEvent.click(screen.getByTestId('splash-reveal-complete'))

    expect(screen.getByTestId('splash')).toHaveAttribute('data-exiting', 'true')
    expect(screen.getByTestId('app-shell')).not.toHaveAttribute('inert')
    expect(screen.getByTestId('hero')).toHaveAttribute('data-active', 'true')

    act(() => vi.advanceTimersByTime(480))
    expect(screen.queryByTestId('splash')).not.toBeInTheDocument()
  })

  it('hides the document scrollbar without disabling page scrolling', () => {
    const { unmount } = render(
      <Providers>
        <App />
      </Providers>,
    )

    expect(document.documentElement).toHaveClass('hide-scrollbar')

    unmount()
    expect(document.documentElement).not.toHaveClass('hide-scrollbar')
  })

  it('waits for readiness and the full reveal, then hands off one sphere before enabling the hero', async () => {
    vi.useFakeTimers()
    render(
      <Providers>
        <App />
      </Providers>,
    )

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    // Dismiss splash so the main content renders
    fireEvent.click(screen.getByTestId('splash-reveal-complete'))

    expect(screen.getAllByTestId('particle-sphere')).toHaveLength(1)
    expect(screen.getByTestId('particle-sphere')).toHaveAttribute(
      'data-phase',
      'splash',
    )
    expect(screen.getByTestId('sphere-stage')).toHaveAttribute(
      'data-phase',
      'splash',
    )
    expect(screen.getByTestId('splash')).toHaveAttribute(
      'data-exiting',
      'false',
    )

    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByTestId('splash')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('splash-reveal-complete'))
    fireEvent.click(screen.getByTestId('hero-layout-ready'))
    expect(screen.getByTestId('splash')).toHaveAttribute(
      'data-exiting',
      'false',
    )

    fireEvent.click(screen.getByTestId('renderer-ready'))
    expect(screen.getByTestId('particle-sphere')).toHaveAttribute(
      'data-phase',
      'transitioning',
    )
    expect(screen.getByTestId('sphere-stage')).toHaveAttribute(
      'data-phase',
      'transitioning',
    )
    expect(screen.getByTestId('splash')).toHaveAttribute('data-exiting', 'true')
    expect(screen.getByTestId('hero')).toHaveAttribute('data-active', 'false')

    fireEvent.click(screen.getByTestId('sphere-transition-complete'))
    expect(screen.getByTestId('sphere-stage')).toHaveAttribute(
      'data-phase',
      'hero',
    )
    expect(screen.getByTestId('hero')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('app-shell')).toHaveAttribute('inert')

    fireEvent.click(screen.getByTestId('hero-reveal-complete'))
    expect(screen.getByTestId('app-shell')).not.toHaveAttribute('inert')
    expect(screen.getByTestId('stardust-cursor')).toBeInTheDocument()
    expect(screen.getAllByTestId('particle-sphere')).toHaveLength(1)
  })

  it('continues the splash when the full reveal finishes before readiness', async () => {
    render(
      <Providers>
        <App />
      </Providers>,
    )

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    fireEvent.click(screen.getByTestId('splash-reveal-complete'))
    expect(screen.getByTestId('particle-sphere')).toHaveAttribute(
      'data-phase',
      'splash',
    )

    fireEvent.click(screen.getByTestId('renderer-ready'))
    fireEvent.click(screen.getByTestId('hero-layout-ready'))

    expect(screen.getByTestId('particle-sphere')).toHaveAttribute(
      'data-phase',
      'transitioning',
    )
  })
})
