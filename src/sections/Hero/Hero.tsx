import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { useTranslation } from '@/i18n'
import { fadeInUp, staggerChildren } from '@/lib/animations/motion-variants'

interface HeroProps {
  active: boolean
  fontsReady: boolean
  onLayoutReady: () => void
  onRevealComplete: () => void
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
    <section ref={sectionRef} className="flex min-h-svh items-center pt-24">
      <Container className="flex flex-col items-center text-center">
        <motion.div
          initial="hidden"
          animate={active ? 'visible' : 'hidden'}
          variants={staggerChildren}
          className="pointer-events-auto flex flex-col items-center gap-6 font-display"
        >
          <motion.h1
            variants={fadeInUp}
            className="order-2 text-5xl font-medium tracking-tight text-fg sm:text-7xl lg:text-8xl"
          >
            {t.hero.heading}
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="order-1 text-sm font-medium uppercase tracking-widest text-accent"
          >
            {t.hero.tagline}
          </motion.p>

          <motion.p
            variants={fadeInUp}
            className="order-3 max-w-lg text-lg leading-relaxed text-fg-muted"
          >
            {t.hero.description}
          </motion.p>

          <motion.div
            variants={fadeInUp}
            onAnimationComplete={handleRevealComplete}
            className="order-4 flex gap-4 pt-4"
          >
            <Button variant="primary">{t.hero.viewWork}</Button>
            <Button variant="secondary">
              <ArrowDown className="mr-2 h-4 w-4" />
              {t.hero.learnMore}
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
