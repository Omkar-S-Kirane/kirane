import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
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

const headingLineVariants: Variants = {
  hidden: { opacity: 0, y: '0.72em' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.33, 1, 0.68, 1] },
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
  const headingLines = t.hero.heading.split('\n')
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
        className="relative z-10 grid w-full grid-cols-1 items-center lg:min-h-[calc(100svh-9rem)] lg:grid-cols-12"
      >
        <motion.div
          initial={prefersReducedMotion ? false : 'hidden'}
          animate={active ? 'visible' : 'hidden'}
          variants={sequenceVariants}
          onAnimationComplete={handleRevealComplete}
          className="max-w-3xl lg:col-span-7"
        >
          <motion.p
            variants={fadeVariants}
            className="mb-6 flex items-center gap-3 font-display text-xs font-medium uppercase tracking-[0.16em] text-accent sm:text-sm"
          >
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            {t.hero.tagline}
          </motion.p>

          <motion.h1
            aria-label={t.hero.heading.replace(/\s+/g, ' ')}
            variants={
              prefersReducedMotion
                ? reducedMotionSequenceVariants
                : headingVariants
            }
            className="max-w-[13ch] font-display text-[clamp(2.7rem,6.2vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.065em] text-fg"
          >
            {headingLines.map((line, index) => (
              <span
                key={`${index}-${line}`}
                aria-hidden="true"
                className="block overflow-hidden pb-[0.08em]"
              >
                <motion.span
                  variants={
                    prefersReducedMotion
                      ? reducedMotionVariants
                      : headingLineVariants
                  }
                  className="block"
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </motion.h1>

          <motion.p
            variants={fadeVariants}
            className="mt-6 max-w-xl text-base leading-relaxed text-fg-muted sm:mt-7 sm:text-lg"
          >
            {t.hero.description}
          </motion.p>

          <motion.div
            variants={fadeVariants}
            className="mt-8 flex w-full flex-col gap-3 min-[380px]:w-fit min-[380px]:flex-row sm:mt-9"
          >
            <Button
              as="a"
              href="#work"
              variant="primary"
              className="group gap-3 px-6"
            >
              {t.hero.viewWork}
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:-translate-y-0.5 motion-safe:group-focus-visible:translate-x-0.5"
              />
            </Button>
            <Button
              as="a"
              href="#contact"
              variant="secondary"
              className="group gap-3 border-border/80 px-6"
            >
              {t.hero.learnMore}
              <ArrowDown
                aria-hidden="true"
                className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-y-0.5 motion-safe:group-focus-visible:translate-y-0.5"
              />
            </Button>
          </motion.div>
        </motion.div>

        <div aria-hidden="true" className="hidden lg:col-span-5 lg:block" />
      </Container>
    </section>
  )
}
