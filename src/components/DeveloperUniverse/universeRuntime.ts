import { createContext, useContext } from 'react'
import type { RefObject } from 'react'
import { Vector3 } from 'three'
import type { OrbitElements } from './orbitalMechanics'
import type {
  TechnologyPlanet,
  UniverseLayout,
} from './developerUniverse.types'

/** A planet resolved for the current layout. */
export interface ScenePlanet {
  planet: TechnologyPlanet
  elements: OrbitElements
  /** Position in the formation sequence (0 = first to appear). */
  orderIndex: number
  /** Position from the innermost orbit outwards. */
  orbitIndex: number
  /** Radius in scene units, layout scale applied. */
  size: number
}

export interface PlanetRuntime {
  meanAnomaly: number
  speedFactor: number
  highlight: number
  entrance: number
  position: Vector3
}

/**
 * Mutable per-frame state shared by the scene components. It lives outside
 * React state so the 60 fps loop never triggers re-renders.
 */
export interface UniverseRuntime {
  /** Smoothed formation progress (0 → 1) for the current frame. */
  formation: number
  /** Elapsed animation time in seconds (frozen when motion is reduced). */
  time: number
  reducedMotion: boolean
  interactive: boolean
  activeId: string | null
  dragging: boolean
  lastDragEndedAt: number
  /** Half extents of the view at the sun's depth, in scene units. */
  viewHalfWidth: number
  viewHalfHeight: number
  cameraDistance: number
  sunPosition: Vector3
  /** Current world radius of the sun (layout radius × formation scale). */
  sunRadius: number
  planets: Map<string, PlanetRuntime>
  layout: UniverseLayout
}

export function createUniverseRuntime(
  planets: readonly ScenePlanet[],
  layout: UniverseLayout,
  reducedMotion: boolean,
): UniverseRuntime {
  return {
    formation: 0,
    time: 0,
    reducedMotion,
    interactive: false,
    activeId: null,
    dragging: false,
    lastDragEndedAt: 0,
    viewHalfWidth: 12,
    viewHalfHeight: 8,
    cameraDistance: 30,
    sunPosition: new Vector3(),
    sunRadius: layout.sunRadius,
    planets: new Map(
      planets.map(({ planet, elements }) => [
        planet.id,
        {
          meanAnomaly: elements.initialMeanAnomaly,
          speedFactor: 0,
          highlight: 0,
          entrance: 0,
          position: new Vector3(),
        },
      ]),
    ),
    layout,
  }
}

export const UniverseRuntimeContext =
  createContext<RefObject<UniverseRuntime> | null>(null)

/**
 * The shared runtime, as a ref: read and update `runtimeRef.current` inside
 * frame callbacks and event handlers, never during render.
 */
export function useUniverseRuntime(): RefObject<UniverseRuntime> {
  const runtimeRef = useContext(UniverseRuntimeContext)
  if (!runtimeRef) {
    throw new Error('useUniverseRuntime must be used inside UniverseScene')
  }
  return runtimeRef
}
