// ---------------------------------------------------------------------------
// Navbar constants
// ---------------------------------------------------------------------------

import type { NavItemKey } from '@/i18n'

export interface NavItem {
  /** Key into `translations.navigation` — resolved at render time. */
  translationKey: NavItemKey
  href: string
  /** Use for a destination that opens a modal instead of a section. */
  action?: 'scroll' | 'modal'
}

/** Height of the navbar in pixels — used for scroll-offset calculations. */
export const NAVBAR_HEIGHT = 56

/** Navigation items shown in the header and responsive menu. */
export const NAV_ITEMS: NavItem[] = [
  { translationKey: 'universe', href: '#universe' },
  { translationKey: 'impact', href: '#impact' },
  { translationKey: 'work', href: '#work' },
  { translationKey: 'experience', href: '#experience' },
  { translationKey: 'skills', href: '#skills' },
  { translationKey: 'resume', href: '#resume' },
]

export const CONTACT_ITEM: NavItem = {
  translationKey: 'contactMe',
  href: '#contact',
}

/** All section IDs the navbar targets (without the leading #). */
export const SECTION_IDS = [
  'home',
  ...NAV_ITEMS.filter((item) => item.action !== 'modal').map((item) =>
    item.href.slice(1),
  ),
  CONTACT_ITEM.href.slice(1),
]

/**
 * Cooldown in ms after a click before IntersectionObserver is allowed
 * to update the active section. Prevents flicker during smooth scrolling.
 */
export const CLICK_COOLDOWN_MS = 800
