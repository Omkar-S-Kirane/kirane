import { useCallback, useEffect, useRef, useState } from 'react'
import { waitForCriticalFonts } from './critical-fonts'
import { useReducedMotion } from 'motion/react'
import { CVModal } from '@/components/cv'
import { CustomCursor } from '@/components/effects/CustomCursor'
import {
  SplashScreen,
  shouldShowSplash,
  markSplashShown,
} from '@/components/effects/SplashScreen'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { ParticleSphere, type ParticleSpherePhase } from '@/components/effects/ParticleSphere'
import { Hero } from '@/sections/Hero'

export function App() {
  // Show splash only once per browser session
  const [showSplash, setShowSplash] = useState(shouldShowSplash)
  const [cvOpen, setCvOpen] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const prefersReducedMotion = useReducedMotion() === true
  const [spherePhase, setSpherePhase] = useState<ParticleSpherePhase>('splash')
  const sphereReadyRef = useRef(false)
  const allReadyRef = useRef(false)

  useEffect(() => {
    waitForCriticalFonts(typeof document !== 'undefined' ? document.fonts : undefined).then(() => {
      setFontsReady(true)
    })
  }, [])

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false)
    markSplashShown()
  }, [])

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

  if (showSplash) {
    return (
      <SplashScreen
        exiting={false}
        fontsReady={fontsReady}
        onRevealComplete={handleSplashComplete}
      />
    )
  }

  return (
    <>
      <CustomCursor />
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
          active={!showSplash}
          fontsReady={fontsReady}
          onLayoutReady={handleLayoutReady}
          onRevealComplete={handleHeroRevealComplete}
        />
      </main>
      <Footer />
      <CVModal isOpen={cvOpen} onClose={handleCloseCv} />
    </>
  )
}
