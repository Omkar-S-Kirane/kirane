// ---------------------------------------------------------------------------
// Navbar constants
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string
  href: string
}

/** Height of the navbar in pixels — used for scroll-offset calculations. */
export const NAVBAR_HEIGHT = 56

/**
 * Navigation items.
 * Section IDs that don't exist yet are still linked so the navbar is
 * ready when those sections are added.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Work', href: '#work' },
  { label: 'Experience', href: '#experience' },
  { label: 'Skills', href: '#skills' },
  { label: 'Resume', href: '#resume' },
]

export const CONTACT_ITEM: NavItem = { label: 'Contact Me', href: '#contact' }

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
