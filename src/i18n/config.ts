// ---------------------------------------------------------------------------
// i18n — Configuration
// ---------------------------------------------------------------------------

import type { LanguageCode } from './types'

/** Metadata for each supported language, rendered in the language switcher. */
export interface LanguageMeta {
  /** BCP 47 code used as the key in locale map and `<html lang>` attribute. */
  code: LanguageCode
  /** Name in the language's own script — shown in the switcher dropdown. */
  nativeName: string
  /** English name — useful for tooltips and accessibility. */
  englishName: string
  /** Value set on `document.documentElement.lang`. */
  htmlLang: string
  /** Text direction — all current languages are LTR. */
  dir: 'ltr' | 'rtl'
}

/**
 * Ordered list of supported languages. The switcher renders them in
 * this order; English is first as the default / fallback language.
 */
export const LANGUAGES: readonly LanguageMeta[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', htmlLang: 'en', dir: 'ltr' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', htmlLang: 'mr', dir: 'ltr' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', htmlLang: 'hi', dir: 'ltr' },
  { code: 'sa', nativeName: 'संस्कृतम्', englishName: 'Sanskrit', htmlLang: 'sa', dir: 'ltr' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati', htmlLang: 'gu', dir: 'ltr' },
] as const

/** Language used on first visit or when localStorage is empty / invalid. */
export const DEFAULT_LANGUAGE: LanguageCode = 'en'

/** localStorage key for persisting the user's language choice. */
export const STORAGE_KEY = 'kirane-lang'

/** Set of valid codes for runtime validation (e.g. reading from storage). */
export const SUPPORTED_CODES: ReadonlySet<string> = new Set(
  LANGUAGES.map((l) => l.code),
)
