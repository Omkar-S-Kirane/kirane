// ---------------------------------------------------------------------------
// Navbar constants
// ---------------------------------------------------------------------------

import type { NavItemKey } from '@/i18n'

export interface NavItem {
  /** Key into `translations.navigation` — resolved at render time. */
  translationKey: NavItemKey
  href: string
  /**
   * When set to 'modal', clicking this item fires `onAction` instead
   * of scrolling to a section. Used by the Resume item to open the CV modal.
   */
  action?: 'scroll' | 'modal'
}

/** Height of the navbar in pixels — used for scroll-offset calculations. */
export const NAVBAR_HEIGHT = 56

/**
 * Navigation items.
 * Section IDs that don't exist yet are still linked so the navbar is
 * ready when those sections are added.
 */
export const NAV_ITEMS: NavItem[] = [
  { translationKey: 'work', href: '#work' },
  { translationKey: 'experience', href: '#experience' },
  { translationKey: 'skills', href: '#skills' },
  { translationKey: 'resume', href: '#resume', action: 'modal' },
]

export const CONTACT_ITEM: NavItem = {
  translationKey: 'contactMe',
  href: '#contact',
}

/** All section IDs the navbar targets (without the leading #). */
export const SECTION_IDS = [
  ...NAV_ITEMS.map((item) => item.href.slice(1)),
  CONTACT_ITEM.href.slice(1),
]

/**
 * Cooldown in ms after a click before IntersectionObserver is allowed
 * to update the active section. Prevents flicker during smooth scrolling.
 */
export const CLICK_COOLDOWN_MS = 800
