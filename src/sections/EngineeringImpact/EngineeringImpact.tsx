import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import {
  DeveloperUniverse,
  getMetricsReveal,
  useUniverseProgress,
} from '@/components/DeveloperUniverse'
import { cn } from '@/lib/cn'
import { MetricCard } from '@/components/ui/MetricCard'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useTranslation } from '@/i18n'
import { getEngineeringMetrics } from './impact-metrics'

const CARD_SCROLL_FACTORS = [0.5, 0.75, 1, 1.25]

interface ImpactUniverseLayoutProps {
  active: boolean
  scrollProgress: number
  formationProgress: MotionValue<number>
}

/**
 * Impact as a scroll-driven Developer Universe. The universe forms first;
 * the Engineering Impact heading and metric cards then fade in around it.
 */
function ImpactUniverseLayout({
  active,
  scrollProgress,
  formationProgress,
}: ImpactUniverseLayoutProps) {
  const { t } = useTranslation()
  const metrics = getEngineeringMetrics()
  const progress = useUniverseProgress(formationProgress)
  const reveal = useTransform(progress, getMetricsReveal)
  const headingY = useTransform(reveal, (value) => (1 - value) * -12)
  const metricsY = useTransform(reveal, (value) => (1 - value) * 24)
  const [revealed, setRevealed] = useState(() => reveal.get() > 0.5)
  useMotionValueEvent(reveal, 'change', (value) => {
    setRevealed(value > 0.5)
  })

  const headingRef = useRef<HTMLDivElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)
  const [insets, setInsets] = useState({ top: 0, bottom: 0 })

  useEffect(() => {
    const heading = headingRef.current
    const metricsBlock = metricsRef.current
    if (!heading || !metricsBlock) return
    const observer = new ResizeObserver(() => {
      const next = {
        top: Math.round(heading.offsetHeight),
        bottom: Math.round(metricsBlock.offsetHeight),
      }
      setInsets((current) =>
        current.top === next.top && current.bottom === next.bottom
          ? current
          : next,
      )
    })
    observer.observe(heading)
    observer.observe(metricsBlock)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="impact"
      aria-label={t.portfolio.impactEyebrow}
      aria-hidden={!active}
      inert={!active}
      hidden={!active}
      className="impact-universe"
    >
      <DeveloperUniverse
        progress={progress}
        active={active}
        reframe={reveal}
        insets={insets}
      />
      <motion.div
        ref={headingRef}
        className="impact-universe__heading"
        style={{ opacity: reveal, y: headingY }}
      >
        <SectionHeading
          eyebrow={t.portfolio.impactEyebrow}
          title={t.portfolio.impactHeading}
          className="mx-auto text-center"
        />
      </motion.div>
      <motion.div
        ref={metricsRef}
        className={cn(
          'impact-universe__metrics',
          !revealed && '[&_*]:pointer-events-none',
        )}
        style={{ opacity: reveal, y: metricsY }}
      >
        <div className="impact-universe__metrics-grid">
          {metrics.map(({ id, value }, index) => (
            <div key={id} className="metric-card-float">
              <MetricCard
                value={value}
                scrollProgress={scrollProgress}
                scrollFactor={CARD_SCROLL_FACTORS[index] ?? 1}
                label={t.portfolio.impactMetrics[id]}
                detail={
                  id === 'platforms'
                    ? t.portfolio.impactMetrics.platformDetails
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export function EngineeringImpact({
  active = true,
  scrollDirection = 1,
  scrollProgress = 0,
  formationProgress,
}: {
  active?: boolean
  scrollDirection?: -1 | 1
  scrollProgress?: number
  /** Scroll progress through the Impact section; enables the Developer Universe. */
  formationProgress?: MotionValue<number>
}) {
  const { t } = useTranslation()
  const metrics = getEngineeringMetrics()
  const reduceMotion = useReducedMotion() === true

  if (formationProgress) {
    return (
      <ImpactUniverseLayout
        active={active}
        scrollProgress={scrollProgress}
        formationProgress={formationProgress}
      />
    )
  }

  return (
    <section
      id="impact"
      aria-label={t.portfolio.impactEyebrow}
      aria-hidden={!active}
      inert={!active}
      hidden={!active}
      className="flex min-h-svh items-center border-t border-border"
    >
      <Container
        maxWidth="wide"
        padding="page"
        safeArea
        className="py-20 sm:py-28"
      >
        <div className="mx-auto w-full max-w-6xl">
          <SectionHeading
            eyebrow={t.portfolio.impactEyebrow}
            title={t.portfolio.impactHeading}
            className="mx-auto text-center"
          />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 xl:grid-cols-4">
            {metrics.map(({ id, value }, index) => (
              <motion.div
                key={id}
                className="metric-card-scroll-layer"
                data-parallax-scroll={scrollDirection > 0 ? 'down' : 'up'}
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: scrollDirection * (28 + index * 12),
                        rotateX: scrollDirection * (index % 2 ? -5 : 5),
                      }
                }
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.82,
                  delay: reduceMotion ? 0 : index * 0.075,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ perspective: 900, transformStyle: 'preserve-3d' }}
              >
                <div className="metric-card-float">
                  <MetricCard
                    value={value}
                    scrollProgress={scrollProgress}
                    scrollFactor={CARD_SCROLL_FACTORS[index] ?? 1}
                    label={t.portfolio.impactMetrics[id]}
                    detail={
                      id === 'platforms'
                        ? t.portfolio.impactMetrics.platformDetails
                        : undefined
                    }
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
