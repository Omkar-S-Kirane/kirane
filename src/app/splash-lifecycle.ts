export const SPLASH_READINESS_SIGNALS = [
  'app-shell',
  'critical-fonts',
  'hero-layout',
  'sphere-renderer',
] as const

export type SplashReadinessSignal = (typeof SPLASH_READINESS_SIGNALS)[number]

export type SplashPhase =
  | 'splash'
  | 'transitioning'
  | 'hero-revealing'
  | 'interactive'

export interface SplashLifecycleState {
  phase: SplashPhase
  readySignals: ReadonlySet<SplashReadinessSignal>
  introComplete: boolean
}

export type SplashLifecycleAction =
  | { type: 'readiness-signal'; signal: SplashReadinessSignal }
  | { type: 'intro-complete' }
  | { type: 'sphere-transition-complete' }
  | { type: 'hero-reveal-complete' }

export function createInitialSplashLifecycle(): SplashLifecycleState {
  return {
    phase: 'splash',
    readySignals: new Set(),
    introComplete: false,
  }
}

export function isPortfolioReady(state: SplashLifecycleState): boolean {
  return SPLASH_READINESS_SIGNALS.every((signal) =>
    state.readySignals.has(signal),
  )
}

function startTransitionWhenReady(
  state: SplashLifecycleState,
): SplashLifecycleState {
  if (
    state.phase !== 'splash' ||
    !state.introComplete ||
    !isPortfolioReady(state)
  ) {
    return state
  }

  return { ...state, phase: 'transitioning' }
}

export function splashLifecycleReducer(
  state: SplashLifecycleState,
  action: SplashLifecycleAction,
): SplashLifecycleState {
  switch (action.type) {
    case 'readiness-signal': {
      if (state.phase !== 'splash' || state.readySignals.has(action.signal)) {
        return state
      }

      const nextState = {
        ...state,
        readySignals: new Set(state.readySignals).add(action.signal),
      }
      return startTransitionWhenReady(nextState)
    }

    case 'intro-complete': {
      if (state.phase !== 'splash' || state.introComplete) return state
      return startTransitionWhenReady({ ...state, introComplete: true })
    }

    case 'sphere-transition-complete':
      return state.phase === 'transitioning'
        ? { ...state, phase: 'hero-revealing' }
        : state

    case 'hero-reveal-complete':
      return state.phase === 'hero-revealing'
        ? { ...state, phase: 'interactive' }
        : state
  }
}
