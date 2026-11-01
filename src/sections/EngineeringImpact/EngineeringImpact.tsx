import { motion, useReducedMotion } from 'motion/react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useTranslation } from '@/i18n'
import { getEngineeringMetrics } from './impact-metrics'
import './EngineeringImpact.css'

const CARD_ENTRANCES = [
  { direction: 'bottom-left', x: -18, y: 18 },
  { direction: 'bottom', x: 0, y: 22 },
  { direction: 'bottom-right', x: 18, y: 18 },
  { direction: 'top-right', x: 14, y: -14 },
] as const

/** Engineering metrics remain distinct from the persistent Universe scene. */
export function EngineeringImpact() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion() === true
  const metrics = getEngineeringMetrics()

  return (
    <section
      id="impact"
      data-page-section
      aria-label={t.portfolio.impactEyebrow}
      className="impact-section"
    >
      <Container
        maxWidth="wide"
        padding="page"
        safeArea
        className="impact-section__container"
      >
        <motion.div
          className="impact-section__heading"
          data-stage-reveal
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
        >
          <SectionHeading
            eyebrow={t.portfolio.impactEyebrow}
            title={t.portfolio.impactHeading}
            className="mx-auto text-center"
          />
        </motion.div>

        <div className="impact-metrics-grid">
          {metrics.map(({ id, value }, index) => {
            const entrance = CARD_ENTRANCES[index] ?? CARD_ENTRANCES[1]
            const label = t.portfolio.impactMetrics[id]
            return (
              <motion.article
                key={id}
                aria-label={`${value} ${label}`}
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, x: entrance.x, y: entrance.y }
                }
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{
                  duration: 0.48,
                  delay: reduceMotion ? 0 : index * 0.07,
                  ease: [0.33, 1, 0.68, 1],
                }}
                className="impact-metric"
                data-entry-direction={entrance.direction}
                data-stage-reveal
              >
                <p className="impact-metric__value" aria-hidden="true">
                  {value}
                </p>
                <h3 className="impact-metric__label">{label}</h3>
                {id === 'platforms' && (
                  <p className="impact-metric__detail">
                    {t.portfolio.impactMetrics.platformDetails}
                  </p>
                )}
              </motion.article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
