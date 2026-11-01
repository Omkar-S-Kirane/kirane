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
  SPLASH_EXIT_DURATION_MS: 1900,
  shouldShowSplash: () => true,
  markSplashShown: vi.fn(),
}))

vi.mock('@/sections/Hero', () => ({
  Hero: ({
    active,
    onLayoutReady,
    onRevealComplete,
    dissolveProgress,
  }: {
    active: boolean
    onLayoutReady: () => void
    onRevealComplete: () => void
    dissolveProgress?: unknown
  }) => (
    <section
      data-testid="hero"
      data-active={active}
      data-cinematic={Boolean(dissolveProgress)}
    >
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
  PortfolioSections: () => (
    <div data-testid="portfolio-sections">
      <section id="work" />
      <section id="experience" />
      <section id="skills" />
      <section id="resume" />
      <section id="contact" />
    </div>
  ),
}))

vi.mock('@/sections/Universe', () => ({
  UniverseSection: () => <section id="universe" data-page-section />,
}))

vi.mock('@/components/DeveloperUniverse/PersistentUniverseBackground', () => ({
  PersistentUniverseBackground: () => (
    <div data-testid="persistent-universe-background">
      <div data-testid="persistent-universe-scene" />
    </div>
  ),
}))

vi.mock('@/sections/EngineeringImpact', () => ({
  EngineeringImpact: () => <section id="impact" data-testid="impact" />,
}))

vi.mock('../sections/CinematicJourney/HeroParticleBridge', () => ({
  HeroParticleBridge: () => null,
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

function createTouchEvent(
  type: string,
  touch?: { clientX: number; clientY: number },
) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', { value: touch ? [touch] : [] })
  return event
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.history.replaceState(null, '', '/')
})

describe('App splash lifecycle', () => {
  it('keeps the Hero transition separate from the ordered persistent-universe sections', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    )

    const main = screen.getByRole('main')
    expect(screen.getByTestId('app-shell')).toHaveClass('app-shell')
    expect(main).toHaveAttribute('data-active-section', 'home')
    expect(main).toHaveAttribute('data-active-stage', 'home')
    const journey = screen.getByTestId('cinematic-journey')
    expect(document.documentElement).toHaveClass('cinematic-locked')
    expect(journey.contains(screen.getByTestId('hero'))).toBe(true)
    expect(journey.querySelector('#impact')).toBeNull()
    expect(main.querySelector('#impact')).toBeNull()
    expect(main.querySelector('#work')).toBeNull()

    const sectionIds = Array.from(
      main.querySelectorAll<HTMLElement>('section[id]'),
      (section) => section.id,
    )
    expect(sectionIds).toEqual(['home'])
    expect(
      document.querySelectorAll('[data-testid="persistent-universe-scene"]'),
    ).toHaveLength(1)
    expect(
      main.contains(screen.getByTestId('persistent-universe-background')),
    ).toBe(false)

    const wheel = new WheelEvent('wheel', {
      deltaY: -100,
      bubbles: true,
      cancelable: true,
    })
    act(() => journey.dispatchEvent(wheel))
    expect(wheel.defaultPrevented).toBe(true)
    expect(window.scrollY).toBe(0)

    const advancingWheel = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    })
    act(() => journey.dispatchEvent(advancingWheel))

    expect(advancingWheel.defaultPrevented).toBe(true)
    const key = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    })
    act(() => journey.dispatchEvent(key))
    expect(key.defaultPrevented).toBe(true)
    expect(window.scrollY).toBe(0)
    expect(main).toHaveAttribute('data-active-stage', 'universe')

    const returnKey = new KeyboardEvent('keydown', {
      key: 'Home',
      bubbles: true,
      cancelable: true,
    })
    act(() => journey.dispatchEvent(returnKey))
    expect(returnKey.defaultPrevented).toBe(true)
    expect(window.scrollY).toBe(0)
    expect(main).toHaveAttribute('data-active-stage', 'home')

    const outsideWheel = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    })
    act(() => main.dispatchEvent(outsideWheel))
    expect(outsideWheel.defaultPrevented).toBe(true)

    act(() =>
      journey.dispatchEvent(
        createTouchEvent('touchstart', { clientX: 80, clientY: 180 }),
      ),
    )
    const horizontalTouch = createTouchEvent('touchmove', {
      clientX: 180,
      clientY: 175,
    })
    act(() => journey.dispatchEvent(horizontalTouch))
    expect(horizontalTouch.defaultPrevented).toBe(false)

    act(() =>
      journey.dispatchEvent(
        createTouchEvent('touchstart', { clientX: 80, clientY: 180 }),
      ),
    )
    const verticalTouch = createTouchEvent('touchmove', {
      clientX: 80,
      clientY: 80,
    })
    act(() => journey.dispatchEvent(verticalTouch))
    expect(verticalTouch.defaultPrevented).toBe(true)
    expect(document.getElementById('home')).toBeInTheDocument()
  })

  it('preserves a valid deep-link stage while the splash screen is shown', () => {
    window.history.replaceState(null, '', '/#impact')
    render(
      <Providers>
        <App />
      </Providers>,
    )

    expect(screen.getByRole('main')).toHaveAttribute(
      'data-active-section',
      'impact',
    )
    expect(window.location.hash).toBe('#impact')
  })

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

    act(() => vi.advanceTimersByTime(1900))
    expect(screen.queryByTestId('splash')).not.toBeInTheDocument()
  })

  it('starts the sphere merge only as the splash begins fading', async () => {
    render(
      <Providers>
        <App />
      </Providers>,
    )

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    fireEvent.click(screen.getByTestId('renderer-ready'))
    expect(screen.getByTestId('sphere-stage')).toHaveAttribute(
      'data-phase',
      'splash',
    )

    fireEvent.click(screen.getByTestId('splash-reveal-complete'))
    expect(screen.getByTestId('splash')).toHaveAttribute('data-exiting', 'true')
    expect(screen.getByTestId('sphere-stage')).toHaveAttribute(
      'data-phase',
      'transitioning',
    )
  })

  it('locks the document only while the cinematic journey is active', () => {
    const { unmount } = render(
      <Providers>
        <App />
      </Providers>,
    )

    const journey = screen.getByTestId('cinematic-journey')
    vi.spyOn(journey, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 1280, window.innerHeight),
    )
    act(() => window.dispatchEvent(new Event('scroll')))
    expect(document.documentElement).toHaveClass('portfolio-natural-scroll')
    expect(document.documentElement).toHaveClass('cinematic-locked')

    unmount()
    expect(document.documentElement).not.toHaveClass('cinematic-locked')
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
