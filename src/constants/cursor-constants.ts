// ---------------------------------------------------------------------------
// Custom cursor constants
// ---------------------------------------------------------------------------

export const DOT_SIZE = 6
export const RING_SIZE = 24
export const RING_HOVER_SCALE = 1.6
export const RING_PRESS_SCALE = 0.85

export const RING_SPRING_CONFIG = { damping: 25, stiffness: 250, mass: 0.5 }
export const DOT_SPRING_CONFIG = { damping: 10, stiffness: 400, mass: 0.25 }

export const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  '[role="button"]',
  'input',
  'textarea',
  'select',
  'label',
  '[tabindex]',
].join(',')
