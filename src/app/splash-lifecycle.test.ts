import { describe, expect, it } from 'vitest'
import {
  createInitialSplashLifecycle,
  isPortfolioReady,
  splashLifecycleReducer,
  type SplashReadinessSignal,
} from './splash-lifecycle'

const REQUIRED_SIGNALS: SplashReadinessSignal[] = [
  'app-shell',
  'critical-fonts',
  'hero-layout',
  'sphere-renderer',
]

function markAllReady() {
  return REQUIRED_SIGNALS.reduce(
    (state, signal) =>
      splashLifecycleReducer(state, { type: 'readiness-signal', signal }),
    createInitialSplashLifecycle(),
  )
}

describe('splash lifecycle', () => {
  it('waits for every required readiness signal', () => {
    const initial = createInitialSplashLifecycle()
    const partiallyReady = splashLifecycleReducer(initial, {
      type: 'readiness-signal',
      signal: 'app-shell',
    })

    expect(isPortfolioReady(initial)).toBe(false)
    expect(isPortfolioReady(partiallyReady)).toBe(false)
    expect(partiallyReady.phase).toBe('splash')
  })

  it('starts the transition only after both readiness and the intro complete', () => {
    const readyFirst = splashLifecycleReducer(markAllReady(), {
      type: 'intro-complete',
    })
    const introFirst = REQUIRED_SIGNALS.reduce(
      (state, signal) =>
        splashLifecycleReducer(state, { type: 'readiness-signal', signal }),
      splashLifecycleReducer(createInitialSplashLifecycle(), {
        type: 'intro-complete',
      }),
    )

    expect(readyFirst.phase).toBe('transitioning')
    expect(introFirst.phase).toBe('transitioning')
  })

  it('ignores duplicate signals and advances through the transition once', () => {
    const state = splashLifecycleReducer(createInitialSplashLifecycle(), {
      type: 'readiness-signal',
      signal: 'critical-fonts',
    })
    const duplicate = splashLifecycleReducer(state, {
      type: 'readiness-signal',
      signal: 'critical-fonts',
    })
    const transitioning = splashLifecycleReducer(markAllReady(), {
      type: 'intro-complete',
    })
    const heroRevealing = splashLifecycleReducer(transitioning, {
      type: 'sphere-transition-complete',
    })
    const interactive = splashLifecycleReducer(heroRevealing, {
      type: 'hero-reveal-complete',
    })

    expect(duplicate).toBe(state)
    expect(heroRevealing.phase).toBe('hero-revealing')
    expect(interactive.phase).toBe('interactive')
    expect(
      splashLifecycleReducer(interactive, {
        type: 'sphere-transition-complete',
      }),
    ).toBe(interactive)
  })
})
