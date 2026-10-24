import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
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
  const {
    activeId,
    scrollDirection,
    navigateTo,
    handleWheel,
    handleTouchStart,
    handleTouchEnd,
  } = useSectionNavigation(showSplash ? 'home' : undefined)
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
    document.documentElement.classList.add('hide-scrollbar')

    return () => {
      document.documentElement.classList.remove('hide-scrollbar')
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
    // Hero reveal is complete
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
        onWheel={
          cvOpen || (showSplash && !splashExiting) ? undefined : handleWheel
        }
        onTouchStart={
          cvOpen || (showSplash && !splashExiting)
            ? undefined
            : handleTouchStart
        }
        onTouchEnd={
          cvOpen || (showSplash && !splashExiting) ? undefined : handleTouchEnd
        }
      >
        <StardustCursor />
        <div
          data-testid="sphere-stage"
          data-phase={spherePhase}
          className="app-sphere-stage"
          style={{ pointerEvents: 'none' }}
        >
          <ParticleSphere
            phase={spherePhase}
            reducedMotion={prefersReducedMotion === true}
            onReady={handleSphereReady}
            onTransitionComplete={handleSphereTransitionComplete}
          />
        </div>
        <Navbar
          onResumeClick={handleOpenCv}
          activeSection={activeId}
          onNavigate={navigateTo}
        />
        <main className="app-page-stage" data-active-section={activeId}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeId}
              className="app-page-transition"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }
              }
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.48,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {activeId === 'home' ? (
                <Hero
                  active={(!showSplash || splashExiting) && activeId === 'home'}
                  fontsReady={fontsReady}
                  onLayoutReady={handleLayoutReady}
                  onRevealComplete={handleHeroRevealComplete}
                />
              ) : (
                <PortfolioSections
                  activeSection={activeId}
                  scrollDirection={scrollDirection}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
        {/* <Footer /> */}
        <CVModal isOpen={cvOpen} onClose={handleCloseCv} />
      </div>
    </>
  )
}
