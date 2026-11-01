import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { waitForCriticalFonts } from './critical-fonts'
import './App.css'
import { CVModal } from '@/components/cv'
import { StardustCursor } from '@/components/effects/StardustCursor'
import {
  SplashScreen,
  SPLASH_EXIT_DURATION_MS,
  shouldShowSplash,
  markSplashShown,
} from '@/components/effects/SplashScreen'
import { Navbar } from '@/components/layout/Navbar'
import { preloadUniverseScene } from '@/components/DeveloperUniverse'
import {
  ParticleSphere,
  type ParticleSpherePhase,
} from '@/components/effects/ParticleSphere'
import { Hero } from '@/sections/Hero'
import { PortfolioSections } from '@/sections/PortfolioSections'
import { useSectionNavigation } from '@/hooks/use-section-navigation'

export function App() {
  // Show splash only once per browser session
  const [showSplash, setShowSplash] = useState(shouldShowSplash)
  const [splashExiting, setSplashExiting] = useState(false)
  const [cvOpen, setCvOpen] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const prefersReducedMotion = useReducedMotion() === true
  const [spherePhase, setSpherePhase] = useState<ParticleSpherePhase>('splash')
  const { activeId, navigateTo } = useSectionNavigation(
    showSplash ? 'home' : undefined,
  )
  const sphereReadyRef = useRef(false)
  const allReadyRef = useRef(false)
  const splashExitTimerRef = useRef<number | null>(null)

  useEffect(() => {
    waitForCriticalFonts(
      typeof document !== 'undefined' ? document.fonts : undefined,
    ).then(() => {
      setFontsReady(true)
    })
  }, [])

  useEffect(
    () => () => {
      if (splashExitTimerRef.current !== null) {
        window.clearTimeout(splashExitTimerRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    document.documentElement.classList.add('portfolio-natural-scroll')

    return () => {
      document.documentElement.classList.remove('portfolio-natural-scroll')
    }
  }, [])

  const handleSplashComplete = useCallback(() => {
    if (splashExiting) return
    setSplashExiting(true)
    markSplashShown()
    splashExitTimerRef.current = window.setTimeout(
      () => {
        splashExitTimerRef.current = null
        setShowSplash(false)
      },
      prefersReducedMotion ? 10 : SPLASH_EXIT_DURATION_MS,
    )
  }, [prefersReducedMotion, splashExiting])

  const checkAllReady = useCallback(() => {
    if (allReadyRef.current) return
    if (fontsReady && splashExiting && sphereReadyRef.current) {
      allReadyRef.current = true
      setSpherePhase('transitioning')
    }
  }, [fontsReady, splashExiting])

  useEffect(() => {
    checkAllReady()
  }, [checkAllReady])

  const handleSphereReady = useCallback(() => {
    sphereReadyRef.current = true
    checkAllReady()
  }, [checkAllReady])

  const handleSphereTransitionComplete = useCallback(() => {
    setSpherePhase('hero')
  }, [])

  const handleLayoutReady = useCallback(() => {
    // Hero layout is ready
  }, [])

  const handleHeroRevealComplete = useCallback(() => {
    // Fetch the Developer Universe scene while the visitor reads the hero.
    preloadUniverseScene()
  }, [])

  const handleOpenCv = useCallback(() => {
    setCvOpen(true)
  }, [])

  const handleCloseCv = useCallback(() => {
    setCvOpen(false)
  }, [])

  return (
    <>
      {showSplash && (
        <SplashScreen
          exiting={splashExiting}
          fontsReady={fontsReady}
          onRevealComplete={handleSplashComplete}
        />
      )}
      <div
        id="app-shell"
        data-testid="app-shell"
        inert={showSplash && !splashExiting}
      >
        <StardustCursor />
        <div
          data-testid="sphere-stage"
          data-phase={spherePhase}
          className="app-sphere-stage"
          style={{ pointerEvents: 'none' }}
        >
          {spherePhase !== 'hero' && (
            <ParticleSphere
              phase={spherePhase}
              reducedMotion={prefersReducedMotion === true}
              onReady={handleSphereReady}
              onTransitionComplete={handleSphereTransitionComplete}
            />
          )}
        </div>
        <Navbar
          onResumeClick={handleOpenCv}
          activeSection={activeId}
          onNavigate={navigateTo}
        />
        <main className="app-page-stage" data-active-section={activeId}>
          <div className="app-page-transition">
            <Hero
              active={(!showSplash || splashExiting) && activeId === 'home'}
              fontsReady={fontsReady}
              onLayoutReady={handleLayoutReady}
              onRevealComplete={handleHeroRevealComplete}
            />
            <PortfolioSections activeSection={activeId} />
          </div>
        </main>
        {/* <Footer /> */}
        <CVModal isOpen={cvOpen} onClose={handleCloseCv} />
      </div>
    </>
  )
}
