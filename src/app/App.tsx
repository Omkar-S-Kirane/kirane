import { useCallback, useEffect, useRef, useState } from 'react'
import { waitForCriticalFonts } from './critical-fonts'
import { useReducedMotion } from 'motion/react'
import { CVModal } from '@/components/cv'
import { StardustCursor } from '@/components/effects/StardustCursor'
import {
  SplashScreen,
  shouldShowSplash,
  markSplashShown,
} from '@/components/effects/SplashScreen'
import { Navbar } from '@/components/layout/Navbar'
import {
  ParticleSphere,
  type ParticleSpherePhase,
} from '@/components/effects/ParticleSphere'
import { Hero } from '@/sections/Hero'

export function App() {
  // Show splash only once per browser session
  const [showSplash, setShowSplash] = useState(shouldShowSplash)
  const [splashExiting, setSplashExiting] = useState(false)
  const [cvOpen, setCvOpen] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const prefersReducedMotion = useReducedMotion() === true
  const [spherePhase, setSpherePhase] = useState<ParticleSpherePhase>('splash')
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
    splashExitTimerRef.current = window.setTimeout(() => {
      splashExitTimerRef.current = null
      setShowSplash(false)
    }, prefersReducedMotion ? 10 : 480)
  }, [prefersReducedMotion, splashExiting])

  const handleSphereReady = useCallback(() => {
    sphereReadyRef.current = true
    checkAllReady()
  }, [])

  const handleSphereTransitionComplete = useCallback(() => {
    setSpherePhase('hero')
  }, [])

  const checkAllReady = useCallback(() => {
    if (allReadyRef.current) return
    if (fontsReady && sphereReadyRef.current) {
      allReadyRef.current = true
      setSpherePhase('transitioning')
    }
  }, [fontsReady])

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
        <Navbar onResumeClick={handleOpenCv} />
        <main>
          <Hero
            active={!showSplash || splashExiting}
            fontsReady={fontsReady}
            onLayoutReady={handleLayoutReady}
            onRevealComplete={handleHeroRevealComplete}
          />
        </main>
        {/* <Footer /> */}
        <CVModal isOpen={cvOpen} onClose={handleCloseCv} />
      </div>
    </>
  )
}
