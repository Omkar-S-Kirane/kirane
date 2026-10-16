// ---------------------------------------------------------------------------
// i18n — Type definitions
// ---------------------------------------------------------------------------

/**
 * Translation shape shared by every locale file. Each namespace groups
 * related strings so components import only what they need via the `t`
 * object returned by useTranslation.
 *
 * Adding a key here will surface a TypeScript error in every locale file
 * that hasn't been updated — ensuring full key parity across languages.
 */
export interface Translations {
  common: {
    brandName: string
    splashTagline: string
    copyright: string
  }
  navigation: {
    work: string
    experience: string
    skills: string
    resume: string
    contactMe: string
  }
  hero: {
    tagline: string
    heading: string
    description: string
    viewWork: string
    learnMore: string
  }
  footer: {
    github: string
    linkedin: string
    email: string
  }
  accessibility: {
    mainNavigation: string
    mobileNavigation: string
    socialLinks: string
    homeLink: string
    openMenu: string
    closeMenu: string
  }
  languageSwitcher: {
    label: string
    changeLanguage: string
  }
}

/**
 * Supported language codes. Matches the keys in the locale map and the
 * filenames under `locales/`.
 */
export type LanguageCode = 'en' | 'mr' | 'hi' | 'sa' | 'gu'

/**
 * Navigation item keys — used by navbar-constants to reference
 * translations without embedding display text.
 */
export type NavItemKey = 'work' | 'experience' | 'skills' | 'resume'

/**
 * Social link keys — used by footer-constants to reference
 * translations without embedding display text.
 */
export type SocialLinkKey = 'github' | 'linkedin' | 'email'
