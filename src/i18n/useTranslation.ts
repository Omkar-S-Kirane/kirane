import { useContext } from 'react'
import { I18nContext } from './context'
import type { I18nContextValue } from './context'

/**
 * Access the current translations object and language controls.
 *
 * ```tsx
 * const { t, language, setLanguage } = useTranslation()
 * return <h1>{t.hero.heading}</h1>
 * ```
 *
 * Must be used within an `<I18nProvider>`.
 */
export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error(
      'useTranslation must be used within an <I18nProvider>. ' +
        'Wrap your app with <I18nProvider> in providers.tsx.',
    )
  }
  return ctx
}
