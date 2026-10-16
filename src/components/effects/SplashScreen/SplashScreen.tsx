import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ScrambleReveal,
  StrokeFill,
} from '@/components/Animations&Motion/TextAnimations/tsx'
import { ParticleSphere } from '@/components/effects/ParticleSphere'
import { useTranslation } from '@/i18n'
import { markSplashShown } from './shouldShowSplash'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How long the splash screen displays before starting to fade out (ms) */
// const SPLASH_DURATION_MS = 3200

/** Duration of the fade-out transition (ms) */
const FADE_DURATION_MS = 800
const BRAND_DRAW_DURATION_SECONDS = 4
const TAGLINE_START_DELAY_MS = 360
const TAGLINE_DURATION_MS = 2300

// ---------------------------------------------------------------------------
// SplashScreen
// ---------------------------------------------------------------------------

interface SplashScreenProps {
  /** Called when the splash has fully exited and the app should show */
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const prefersReducedMotion = useReducedMotion()
  const [visible] = useState(true)
  const [taglineStarted, setTaglineStarted] = useState(
    () => prefersReducedMotion === true,
  )
  const brandCompletionHandled = useRef(prefersReducedMotion === true)
  const taglineTimer = useRef<number | null>(null)
  const { t } = useTranslation()

  // Once AnimatePresence finishes the exit animation, notify parent
  const handleExitComplete = useCallback(() => {
    markSplashShown()
    onComplete()
  }, [onComplete])

  const handleBrandAnimationComplete = useCallback(() => {
    if (brandCompletionHandled.current) return
    brandCompletionHandled.current = true

    if (prefersReducedMotion) {
      setTaglineStarted(true)
      return
    }

    taglineTimer.current = window.setTimeout(() => {
      taglineTimer.current = null
      setTaglineStarted(true)
    }, TAGLINE_START_DELAY_MS)
  }, [prefersReducedMotion])

  useEffect(() => {
    if (prefersReducedMotion) {
      brandCompletionHandled.current = true
      setTaglineStarted(true)
    }

    return () => {
      if (taglineTimer.current !== null) {
        window.clearTimeout(taglineTimer.current)
        taglineTimer.current = null
      }
    }
  }, [prefersReducedMotion])

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.2 : FADE_DURATION_MS / 1000,
            ease: [0.33, 1, 0.68, 1],
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: 'var(--splash-bg)' }}
        >
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <ParticleSphere reducedMotion={!!prefersReducedMotion} />
          </div>
          <StrokeFill
            text={t.common.brandName}
            duration={BRAND_DRAW_DURATION_SECONDS}
            onComplete={handleBrandAnimationComplete}
            position="bottom-left"
            strokeEffect="glass"
            fillMode="outline"
          >
            <ScrambleReveal
              className="stroke-fill__tagline"
              text={t.common.splashTagline}
              duration={TAGLINE_DURATION_MS}
              start={taglineStarted || prefersReducedMotion === true}
            />
          </StrokeFill>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
