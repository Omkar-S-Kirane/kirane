import { useCallback, useEffect, useReducer } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ParticleSphere } from '@/components/effects/ParticleSphere'
import type { ParticleSpherePhase } from '@/components/effects/ParticleSphere/ParticleSphere'
import { SplashScreen } from '@/components/effects/SplashScreen'
import { CustomCursor } from '@/components/effects/CustomCursor'
import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/sections/Hero'
import { PortfolioSections } from '@/sections/PortfolioSections'
import { waitForCriticalFonts } from './critical-fonts'
import {
  createInitialSplashLifecycle,
  splashLifecycleReducer,
  type SplashReadinessSignal,
} from './splash-lifecycle'
import './App.css'

export function App() {
  const [lifecycle, dispatch] = useReducer(
    splashLifecycleReducer,
    undefined,
    createInitialSplashLifecycle,
  )
  const prefersReducedMotion = useReducedMotion() === true
  const interactive = lifecycle.phase === 'interactive'
  const heroActive =
    lifecycle.phase === 'hero-revealing' || lifecycle.phase === 'interactive'
  const spherePhase: ParticleSpherePhase =
    lifecycle.phase === 'splash'
      ? 'splash'
      : lifecycle.phase === 'transitioning'
        ? 'transitioning'
        : 'hero'
  const criticalFontsReady = lifecycle.readySignals.has('critical-fonts')

  const reportReadiness = useCallback(
    (signal: SplashReadinessSignal) =>
      dispatch({ type: 'readiness-signal', signal }),
    [],
  )

  const handleHeroLayoutReady = useCallback(() => {
    reportReadiness('hero-layout')
  }, [reportReadiness])

  const handleSphereReady = useCallback(() => {
    reportReadiness('sphere-renderer')
  }, [reportReadiness])

  const handleSplashRevealComplete = useCallback(() => {
    dispatch({ type: 'intro-complete' })
  }, [])

  const handleSphereTransitionComplete = useCallback(() => {
    dispatch({ type: 'sphere-transition-complete' })
  }, [])

  const handleHeroRevealComplete = useCallback(() => {
    dispatch({ type: 'hero-reveal-complete' })
  }, [])

  useEffect(() => {
    reportReadiness('app-shell')
  }, [reportReadiness])

  useEffect(() => {
    let active = true

    void waitForCriticalFonts(document.fonts).then(() => {
      if (active) reportReadiness('critical-fonts')
    })

    return () => {
      active = false
    }
  }, [reportReadiness])

  const exitingSplash = lifecycle.phase === 'transitioning'
  const showSplash =
    lifecycle.phase === 'splash' || lifecycle.phase === 'transitioning'

  return (
    <div className="relative isolate min-h-svh overflow-x-clip bg-black">
      <div className="absolute inset-0 z-0 h-svh" aria-hidden="true">
        <div
          data-testid="sphere-stage"
          data-phase={spherePhase}
          className="app-sphere-stage"
        >
          <ParticleSphere
            reducedMotion={prefersReducedMotion}
            phase={spherePhase}
            onReady={handleSphereReady}
            onTransitionComplete={handleSphereTransitionComplete}
          />
        </div>
      </div>

      <motion.div
        data-testid="app-shell"
        aria-hidden={!interactive}
        inert={!interactive}
        initial={false}
        animate={{ opacity: heroActive ? 1 : 0 }}
        transition={{
          duration: prefersReducedMotion ? 0.01 : 0.48,
          ease: [0.33, 1, 0.68, 1],
        }}
        className="pointer-events-none relative z-10 min-h-svh"
      >
        {interactive && <CustomCursor />}
        <div className="pointer-events-auto">
          <Navbar />
        </div>
        <main>
          <Hero
            active={heroActive}
            fontsReady={criticalFontsReady}
            onLayoutReady={handleHeroLayoutReady}
            onRevealComplete={handleHeroRevealComplete}
          />
          <PortfolioSections />
        </main>
        {/* <div className="pointer-events-auto">
          <Footer />
        </div> */}
      </motion.div>

      {showSplash && (
        <SplashScreen
          exiting={exitingSplash}
          fontsReady={criticalFontsReady}
          onRevealComplete={handleSplashRevealComplete}
        />
      )}
    </div>
  )
}
