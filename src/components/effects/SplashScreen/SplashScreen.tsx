
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  ScrambleReveal,
  StrokeFill,
} from '@/components/Animations&Motion/TextAnimations/tsx'
import { StormSplash } from '@/components/effects/StormSplash'
import { useTranslation } from '@/i18n'

export const SPLASH_EXIT_DURATION_MS = 1900
const EXIT_DURATION_SECONDS = SPLASH_EXIT_DURATION_MS / 1000
const TEXT_EXIT_DURATION_SECONDS = 0.48
const BRAND_DRAW_DURATION_SECONDS = 4
const TAGLINE_START_DELAY_MS = 360
const TAGLINE_DURATION_MS = 2300

/**
 * Determines whether the splash screen should be shown.
 * Always returns true — the splash screen is persistent.
 */
export function shouldShowSplash(): boolean {
  return true
}

/**
 * Marks the splash screen as shown for the current session.
 * Retained for API compatibility; currently a no-op since splash is persistent.
 */
export function markSplashShown(): void {
  /* no-op — splash always shows */
}

interface SplashScreenProps {
  exiting: boolean
  fontsReady: boolean
  onRevealComplete: () => void
}

export function SplashScreen({
  exiting,
  fontsReady,
  onRevealComplete,
}: SplashScreenProps) {
  const prefersReducedMotion = useReducedMotion()
  const [taglineStarted, setTaglineStarted] = useState(
    () => prefersReducedMotion === true,
  )
  const brandCompletionHandled = useRef(prefersReducedMotion === true)
  const taglineTimer = useRef<number | null>(null)
  const { t } = useTranslation()

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
    <div
      aria-hidden={exiting}
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      <motion.div
        initial={false}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{
          duration: prefersReducedMotion ? 0.01 : EXIT_DURATION_SECONDS,
          ease: [0.65, 0, 0.35, 1],
        }}
        className="absolute inset-0"
      >
        {/* Crossfade the splash sphere with the matching hero sphere. */}
        <StormSplash />
      </motion.div>

      {/* Brand text overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{
          duration: prefersReducedMotion ? 0.01 : TEXT_EXIT_DURATION_SECONDS,
          ease: [0.33, 1, 0.68, 1],
        }}
        className="absolute inset-0"
      >
        {fontsReady && (
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
              onComplete={onRevealComplete}
            />
          </StrokeFill>
        )}
      </motion.div>
    </div>
  )
}
