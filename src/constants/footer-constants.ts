// ---------------------------------------------------------------------------
// Footer constants
// ---------------------------------------------------------------------------

import type { SocialLinkKey } from '@/i18n'

export interface SocialLink {
  /** Key into `translations.footer` — resolved at render time. */
  translationKey: SocialLinkKey
  href: string
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { translationKey: 'github', href: '#' },
  { translationKey: 'linkedin', href: '#' },
  { translationKey: 'email', href: '#' },
] as const

export const CURRENT_YEAR = new Date().getFullYear()
