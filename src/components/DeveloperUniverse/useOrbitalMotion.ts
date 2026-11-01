import { useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import type { Group } from 'three'
import {
  FOCUSED_ORBIT_SPEED,
  IDLE_ORBIT_SPEED,
} from './developerUniverse.constants'
import {
  easeOutCubic,
  getActivation,
  getPlanetEntrance,
} from './formationTimeline'
import { orbitalPosition } from './orbitalMechanics'
import { useUniverseRuntime } from './universeRuntime'
import type { ScenePlanet } from './universeRuntime'

/**
 * Advances one planet along its own Keplerian orbit every frame.
 *
 * Each planet integrates its own mean anomaly with its own mean motion, so
 * the bodies never move as a single rotating group. Speed eases from a slow
 * drift (just arrived) to full speed (system activated), and towards a
 * standstill while the planet is hovered or selected.
 */
export function useOrbitalMotion(
  scenePlanet: ScenePlanet,
  planetCount: number,
  groupRef: RefObject<Group | null>,
) {
  const runtimeRef = useUniverseRuntime()
  const { planet, elements, orderIndex, size } = scenePlanet
  const pointRef = useRef(new Vector3())
  const outwardRef = useRef(new Vector3())

  useFrame((_, rawDelta) => {
    const runtime = runtimeRef.current
    const point = pointRef.current
    const outward = outwardRef.current
    const state = runtime.planets.get(planet.id)
    if (!state) return
    const delta = Math.min(rawDelta, 0.1)
    const formation = runtime.formation

    state.entrance = getPlanetEntrance(formation, orderIndex, planetCount)
    const isActive = runtime.activeId === planet.id
    const cruising = runtime.reducedMotion
      ? 0
      : IDLE_ORBIT_SPEED + (1 - IDLE_ORBIT_SPEED) * getActivation(formation)
    const target =
      state.entrance <= 0 ? 0 : isActive ? FOCUSED_ORBIT_SPEED : cruising
    state.speedFactor = MathUtils.damp(
      state.speedFactor,
      target,
      isActive ? 5 : 2.2,
      delta,
    )
    state.meanAnomaly += elements.meanMotion * state.speedFactor * delta
    state.highlight = MathUtils.damp(
      state.highlight,
      isActive ? 1 : 0,
      8,
      delta,
    )

    orbitalPosition(elements, state.meanAnomaly, point)
    // Arrive from further out and slightly above, easing into the orbit.
    const travel = 1 - easeOutCubic(state.entrance)
    if (travel > 0) {
      outward.copy(point).normalize()
      point.addScaledVector(outward, travel * (1.4 + size * 2))
      point.y += travel * 0.9
    }
    state.position.copy(point)
    groupRef.current?.position.copy(point)
  })
}
