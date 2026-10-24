import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { Container } from '@/components/ui/Container'
import { PressureTest } from '@/components/Animations&Motion/TextAnimations/tsx/PressureTest'
import { useTranslation } from '@/i18n'
import { fadeInUp } from '@/lib/animations/motion-variants'

interface HeroProps {
  active: boolean
  fontsReady: boolean
  onLayoutReady: () => void
  onRevealComplete: () => void
}

const contentVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.14,
    },
  },
}

const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.01 },
  },
}

const reducedMotionSequenceVariants: Variants = {
  hidden: {},
  visible: {},
}

const headingVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export function Hero({
  active,
  fontsReady,
  onLayoutReady,
  onRevealComplete,
}: HeroProps) {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion() === true
  const sectionRef = useRef<HTMLElement | null>(null)
  const layoutReadyReported = useRef(false)
  const revealCompleteReported = useRef(false)
  const sequenceVariants = prefersReducedMotion
    ? reducedMotionSequenceVariants
    : contentVariants
  const fadeVariants = prefersReducedMotion ? reducedMotionVariants : fadeInUp

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!fontsReady || !section || layoutReadyReported.current) return

    section.getBoundingClientRect()
    layoutReadyReported.current = true
    onLayoutReady()
  }, [fontsReady, onLayoutReady])

  useEffect(() => {
    if (!active) {
      revealCompleteReported.current = false
      return
    }

    if (prefersReducedMotion && !revealCompleteReported.current) {
      revealCompleteReported.current = true
      onRevealComplete()
    }
  }, [active, onRevealComplete, prefersReducedMotion])

  const handleRevealComplete = useCallback(
    (definition: string) => {
      if (
        !active ||
        definition !== 'visible' ||
        revealCompleteReported.current
      ) {
        return
      }

      revealCompleteReported.current = true
      onRevealComplete()
    },
    [active, onRevealComplete],
  )

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative flex min-h-svh items-start overflow-hidden pt-[clamp(8rem,18svh,11rem)] pb-[calc(3.5rem+var(--layout-safe-area-bottom))] lg:items-center lg:pt-28"
    >
      <Container
        maxWidth="wide"
        padding="page"
        safeArea
        className="relative z-10 grid w-full grid-cols-1 items-center lg:min-h-[calc(100svh-9rem)]"
      >
        <motion.div
          initial={prefersReducedMotion ? false : 'hidden'}
          animate={active ? 'visible' : 'hidden'}
          variants={sequenceVariants}
          onAnimationComplete={handleRevealComplete}
          className="mx-auto w-full max-w-5xl text-center"
        >
          <motion.div
            variants={
              prefersReducedMotion
                ? reducedMotionSequenceVariants
                : headingVariants
            }
            className="w-full"
          >
            <PressureTest text={t.hero.heading} tag="h1" className="text-fg" />
          </motion.div>

          <motion.p
            variants={fadeVariants}
            className="mx-auto mt-6 max-w-2xl text-center font-display text-base leading-relaxed text-secondary sm:text-lg"
          >
            {t.hero.tagline}
          </motion.p>
        </motion.div>

      </Container>
    </section>
  )
}
