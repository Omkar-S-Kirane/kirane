import type { TechnologyLogoId } from './technologyLogos'

export type TechnologyCategory =
  'frontend' | 'mobile' | 'backend' | 'database' | 'versionControl' | 'cloud'

export type ProficiencyLevel = 'Advanced' | 'Intermediate' | 'Learning'

/** Procedural surface used by the planet shader. */
export type PlanetSurface = 'banded' | 'rocky' | 'smooth' | 'crystalline'

/** How a planet arrives during the scroll-driven formation. */
export type PlanetEntrance = 'scale' | 'particles' | 'fade'

export interface TechnologyPlanet {
  id: string
  name: string
  category: TechnologyCategory
  description: string
  /** Years of hands-on experience, or null when not yet confirmed. */
  experienceYears: number | null
  /** Completed projects, or null when not yet confirmed. */
  projectsCompleted: number | null
  proficiency: ProficiencyLevel
  logo: TechnologyLogoId
  /** Semi-major axis of the orbit, in scene units. */
  orbitalRadius: number
  /** Mean motion in radians per second at full speed. */
  orbitalSpeed: number
  /** Tilt of the orbital plane, in degrees. */
  orbitalInclination: number
  /** 0 is a circle; keep below ~0.15 for an elegant composition. */
  orbitalEccentricity: number
  /** Longitude of the ascending node, in degrees. */
  orbitalNode: number
  /** Starting position along the orbit (mean anomaly), in degrees. */
  orbitalPhase: number
  /** Planet radius, in scene units. */
  planetSize: number
  /** Planet body colour. */
  color: string
  /** Colour of the logo printed on the planet. */
  logoColor: string
  surface: PlanetSurface
  entrance: PlanetEntrance
  /** Featured planets remain on compact (mobile) layouts. */
  featured: boolean
  skills: string[]
  /** Ids of related planets, shown in the information card. */
  relatedTechnologies: string[]
}

export type UniverseLayoutTier = 'compact' | 'medium' | 'wide'

export interface UniverseQuality {
  stars: number
  dust: number
  sunParticles: number
  orbitParticlesPerOrbit: number
  sphereSegments: number
  maxDpr: number
}

export interface UniverseLayout {
  tier: UniverseLayoutTier
  coarsePointer: boolean
  quality: UniverseQuality
  /** Scene radius of the central sun. */
  sunRadius: number
  /** Multiplier applied to every planet radius. */
  planetScale: number
  /** Multiplier for the invisible hit sphere used for raycasting. */
  hitScale: number
  /** Vertical field of view, in degrees. */
  fov: number
  /** Camera elevation above the orbital plane, in degrees. */
  elevation: number
  /** Portion of the viewport width the outermost orbit may use (above 1 crops). */
  fitFactor: number
}

/** Screen-space circle, in CSS pixels relative to the universe viewport. */
export interface ScreenCircle {
  x: number
  y: number
  r: number
}

export interface UniverseFrame {
  width: number
  height: number
  sun: ScreenCircle
  /** Projected circle of the active (hovered or selected) planet. */
  planet: ScreenCircle | null
}
