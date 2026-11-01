import { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionValue, useReducedMotion } from 'motion/react'
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
import { PersistentUniverseBackground } from '@/components/DeveloperUniverse/PersistentUniverseBackground'
import { CinematicStageHost } from '@/components/navigation/CinematicStageHost'
import {
  CINEMATIC_STAGE_IDS,
  useCinematicNavigation,
  type CinematicStageId,
} from '@/hooks/use-cinematic-navigation'
import {
  CinematicJourney,
  type CinematicJourneyHandle,
} from '@/sections/CinematicJourney'

export function App() {
  // Show splash only once per browser session
  const [showSplash, setShowSplash] = useState(shouldShowSplash)
  const [splashExiting, setSplashExiting] = useState(false)
  const [cvOpen, setCvOpen] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const prefersReducedMotion = useReducedMotion() === true
  const [spherePhase, setSpherePhase] = useState<ParticleSpherePhase>('splash')
  const journeyRef = useRef<CinematicJourneyHandle>(null)
  const {
    activeStage,
    universeEntered,
    navigateTo,
    onTransitionComplete,
    onUniverseEnteredChange,
    onHeroTransitionComplete,
    onHeroTransitionReset,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
  } = useCinematicNavigation(journeyRef)
  const universeProgress = useMotionValue(activeStage === 'home' ? 0 : 1)
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
    document.documentElement.classList.add('cinematic-locked')

    return () => {
      document.documentElement.classList.remove('portfolio-natural-scroll')
      document.documentElement.classList.remove('cinematic-locked')
    }
  }, [])

  useEffect(() => {
    const viewport = document.getElementById('app-shell')
    if (!viewport) return
    viewport.addEventListener('wheel', handleWheel, { passive: false })
    viewport.addEventListener('touchstart', handleTouchStart, { passive: true })
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false })
    viewport.addEventListener('touchend', handleTouchEnd, { passive: true })
    viewport.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    viewport.addEventListener('keydown', handleKeyDown)
    return () => {
      viewport.removeEventListener('wheel', handleWheel)
      viewport.removeEventListener('touchstart', handleTouchStart)
      viewport.removeEventListener('touchmove', handleTouchMove)
      viewport.removeEventListener('touchend', handleTouchEnd)
      viewport.removeEventListener('touchcancel', handleTouchEnd)
      viewport.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    handleKeyDown,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
    handleWheel,
  ])

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

  const handleNavigate = useCallback(
    (id: string) => {
      if (CINEMATIC_STAGE_IDS.includes(id as CinematicStageId)) {
        navigateTo(id as CinematicStageId)
      }
    },
    [navigateTo],
  )

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
        className="app-shell"
        data-testid="app-shell"
        inert={showSplash && !splashExiting}
      >
        <StardustCursor />
        <PersistentUniverseBackground
          progress={universeProgress}
          entered={universeEntered}
          activeSection={activeStage}
        />
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
          activeSection={activeStage}
          onNavigate={handleNavigate}
        />
        <main
          className="app-page-stage"
          data-active-section={activeStage}
          data-active-stage={activeStage}
        >
          <div className="app-page-transition">
            <CinematicJourney
              ref={journeyRef}
              initialProgress={activeStage === 'home' ? 0 : 1}
              universeProgress={universeProgress}
              active={(!showSplash || splashExiting) && activeStage === 'home'}
              onUniverseEnteredChange={onUniverseEnteredChange}
              onHeroTransitionComplete={onHeroTransitionComplete}
              onHeroTransitionReset={onHeroTransitionReset}
              fontsReady={fontsReady}
              onLayoutReady={handleLayoutReady}
              onRevealComplete={handleHeroRevealComplete}
            />
          </div>
          <CinematicStageHost
            activeStage={activeStage}
            onTransitionComplete={onTransitionComplete}
            onOpenResume={handleOpenCv}
          />
        </main>
        {/* <Footer /> */}
        <CVModal isOpen={cvOpen} onClose={handleCloseCv} />
      </div>
    </>
  )
}
