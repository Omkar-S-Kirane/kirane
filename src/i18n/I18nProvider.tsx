import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGES, STORAGE_KEY, SUPPORTED_CODES } from './config'
import { I18nContext } from './context'
import type { I18nContextValue } from './context'
import { translations } from './locales'
import type { LanguageCode } from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads the persisted language from localStorage (if valid) or falls
 * back to the default. Called synchronously during initial render to
 * avoid a flash of the wrong language.
 */
function getInitialLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED_CODES.has(stored)) {
      return stored as LanguageCode
    }
  } catch {
    // localStorage may throw in private browsing on some browsers
  }
  return DEFAULT_LANGUAGE
}

/**
 * Sync the `<html>` element's `lang` and `dir` attributes to the
 * selected language. Called on mount and whenever the language changes.
 */
function applyHtmlAttributes(code: LanguageCode): void {
  const meta = LANGUAGES.find((l) => l.code === code)
  if (meta) {
    document.documentElement.lang = meta.htmlLang
    document.documentElement.dir = meta.dir
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage)

  // Apply html attributes on mount and when language changes
  useEffect(() => {
    applyHtmlAttributes(language)
  }, [language])

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // Silently ignore write failures (quota, private browsing)
    }
  }, [])

  const value = useMemo<I18nContextValue>(
    () => ({
      t: translations[language],
      language,
      setLanguage,
    }),
    [language, setLanguage],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
