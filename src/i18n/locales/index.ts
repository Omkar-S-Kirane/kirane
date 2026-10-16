import type { LanguageCode, Translations } from '../types'
import en from './en'
import gu from './gu'
import hi from './hi'
import mr from './mr'
import sa from './sa'

/**
 * Map of every supported language code to its translations object.
 * Used by I18nProvider to resolve the active locale at runtime.
 */
export const translations: Record<LanguageCode, Translations> = {
  en,
  mr,
  hi,
  sa,
  gu,
}
