
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  ScrambleReveal,
  StrokeFill,
} from '@/components/Animations&Motion/TextAnimations/tsx'
import { StormSplash } from '@/components/effects/StormSplash'
import { useTranslation } from '@/i18n'

const EXIT_DURATION_SECONDS = 0.48
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
    <motion.div
      initial={false}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{
        duration: prefersReducedMotion ? 0.01 : EXIT_DURATION_SECONDS,
        ease: [0.33, 1, 0.68, 1],
      }}
      aria-hidden={exiting}
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      {/* Storm particle sphere background */}
      <StormSplash />

      {/* Brand text overlay */}
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
  )
}
