import { motion, useReducedMotion } from 'motion/react'
import { MetricCard } from '@/components/ui/MetricCard'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useTranslation } from '@/i18n'
import { getEngineeringMetrics } from './impact-metrics'

export function EngineeringImpact({
  active = true,
  scrollDirection = 1,
}: {
  active?: boolean
  scrollDirection?: -1 | 1
}) {
  const { t } = useTranslation()
  const metrics = getEngineeringMetrics()
  const reduceMotion = useReducedMotion() === true

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
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
