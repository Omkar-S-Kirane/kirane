import { useTranslation } from '@/i18n'

/** Full-screen destination and screen-reader introduction to the persistent scene. */
export function UniverseSection() {
  const { t } = useTranslation()

  return (
    <section
      id="universe"
      data-page-section
      aria-label={t.universe.sceneLabel}
      className="universe-section"
      data-stage-panel
    >
      <h1 className="sr-only">{t.universe.sceneLabel}</h1>
      <p className="sr-only">{t.universe.scrollHint}</p>
    </section>
  )
}
