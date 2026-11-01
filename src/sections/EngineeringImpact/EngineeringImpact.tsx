import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useScroll,
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
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useTranslation } from '@/i18n'
import { getEngineeringMetrics } from './impact-metrics'

const CARD_ENTRANCES = [
  { direction: 'bottom-left', x: -28, y: 24 },
  { direction: 'bottom', x: 0, y: 34 },
  { direction: 'bottom-right', x: 28, y: 24 },
  { direction: 'top-right', x: 28, y: -20 },
] as const

interface ImpactUniverseLayoutProps {
  active: boolean
  formationProgress?: MotionValue<number>
}

/**
 * Impact as a scroll-driven Developer Universe. The universe forms first;
 * the Engineering Impact heading and metric cards then fade in around it.
 */
function ImpactUniverseLayout({
  active,
  formationProgress,
}: ImpactUniverseLayoutProps) {
  const { t } = useTranslation()
  const metrics = getEngineeringMetrics()
  const reduceMotion = useReducedMotion() === true
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  const scrollSource = useTransform(
    formationProgress ?? scrollYProgress,
    (value) => (reduceMotion ? 1 : value),
  )
  const smoothedProgress = useUniverseProgress(scrollSource)
  const progress = useTransform(
    reduceMotion ? scrollSource : smoothedProgress,
    (value) => (reduceMotion ? 1 : value),
  )
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
    if (!heading || !metricsBlock || typeof ResizeObserver === 'undefined')
      return
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
      ref={sectionRef}
      id="impact"
      data-page-section
      aria-label={t.portfolio.impactEyebrow}
      className="impact-universe"
    >
      <div className="impact-universe__sticky">
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
            {metrics.map(({ id, value }, index) => {
              const entrance = CARD_ENTRANCES[index] ?? CARD_ENTRANCES[1]
              return (
                <motion.div
                  key={id}
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          x: entrance.x,
                          y: entrance.y,
                          scale: 0.96,
                        }
                  }
                  animate={
                    revealed
                      ? { opacity: 1, x: 0, y: 0, scale: 1 }
                      : {
                          opacity: 0,
                          x: entrance.x,
                          y: entrance.y,
                          scale: 0.96,
                        }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 110,
                    damping: 22,
                    mass: 0.7,
                    delay: reduceMotion ? 0 : index * 0.08,
                  }}
                  className="impact-metric-entry"
                  data-entry-direction={entrance.direction}
                >
                  <MetricCard
                    value={value}
                    label={t.portfolio.impactMetrics[id]}
                    detail={
                      id === 'platforms'
                        ? t.portfolio.impactMetrics.platformDetails
                        : undefined
                    }
                  />
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export function EngineeringImpact({
  active = true,
  formationProgress,
}: {
  active?: boolean
  /** Scroll progress through the Impact section; enables the Developer Universe. */
  formationProgress?: MotionValue<number>
}) {
  return (
    <ImpactUniverseLayout
      active={active}
      formationProgress={formationProgress}
    />
  )
}
