import { createContext } from 'react'
import type { Translations } from './types'
import type { LanguageCode } from './types'

// ---------------------------------------------------------------------------
// i18n — Context definition (separated for fast-refresh compatibility)
// ---------------------------------------------------------------------------

export interface I18nContextValue {
  /** The active translations object — use direct property access: `t.hero.tagline`. */
  t: Translations
  /** The current language code. */
  language: LanguageCode
  /** Switch to a different language. Persists the choice in localStorage. */
  setLanguage: (code: LanguageCode) => void
}

export const I18nContext = createContext<I18nContextValue | null>(null)
