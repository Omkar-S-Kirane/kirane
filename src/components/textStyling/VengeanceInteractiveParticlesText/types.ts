// ---------------------------------------------------------------------------
// VengeanceInteractiveParticlesText — public props & internal types
// ---------------------------------------------------------------------------

/**
 * Props for the VengeanceInteractiveParticlesText component.
 *
 * Renders the supplied `text` as thousands of GPU-accelerated particles
 * that respond to pointer movement (scatter / displace and return).
 */
export interface VengeanceInteractiveParticlesTextProps {
  /** The text string to render as particles. Supports multiline via `\n`. */
  text: string
  /** Additional CSS class names applied to the container div */
  className?: string
  /** Particle colour as a CSS colour string (hex, rgb, hsl, named). */
  color?: string
  /** Wrapper background colour. */
  background?: string
  /** Font size in CSS pixels used when sampling the text on an offscreen canvas. */
  fontSize?: number
  /** Font family used when rendering the text on the offscreen canvas. */
  fontFamily?: string
  /** Font weight used when rendering the text on the offscreen canvas. */
  fontWeight?: number | string
  /** Letter spacing in px applied to the sampled text. */
  letterSpacing?: number
  /** Base particle size in world units. */
  particleSize?: number
  /** Depth of simplex-noise displacement along the z axis. */
  depth?: number
  /** Strength of the initial random-scatter animation. Values 0–1 where 1 is full scatter. */
  randomness?: number
  /** Multiplier for the speed of time-based noise movement. */
  speed?: number
  /** Cursor interaction radius in px. */
  interactionRadius?: number
  /** Interaction force multiplier. */
  interactionStrength?: number
  /** Speed at which particles return to their home position (0–1). */
  returnSpeed?: number
  /** Sampling density (0–1). Lower = fewer particles. */
  particleDensity?: number
  /** Enable continuous drift and pointer interaction. Defaults to true. */
  animated?: boolean
  /** Reduced-motion fallback: 'static' (still particles) or 'plain-text'. Defaults to 'static'. */
  reducedMotionFallback?: 'static' | 'plain-text'
  /** Accessible label for the component. Falls back to the visible text. */
  ariaLabel?: string
  /** Fired once particle positions are ready. */
  onReady?: () => void
}

// ---------------------------------------------------------------------------
// Internal types — used by the component implementation, not exported from
// the package barrel.
// ---------------------------------------------------------------------------

/** 2D point used for touch-trail tracking */
export interface TrailPoint {
  x: number
  y: number
  age: number
  force: number
}

/** Sampled particle data returned by the text-sampling function */
export interface ParticleSampleData {
  /** Flat Float32Array of [x, y, x, y, …] offsets in world space */
  offsets: Float32Array
  /** Per-particle brightness (0–1) derived from the sampled pixel luminance */
  brightness: Float32Array
  /** Number of sampled particles */
  count: number
  /** Width of the sampling canvas in pixels */
  textureWidth: number
  /** Height of the sampling canvas in pixels */
  textureHeight: number
}
