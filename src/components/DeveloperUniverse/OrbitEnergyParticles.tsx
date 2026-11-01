import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color } from 'three'
import type { Points, ShaderMaterial } from 'three'
import { UNIVERSE_PALETTE } from './developerUniverse.constants'
import { getOrbitDraw, getOrbitEnergy } from './formationTimeline'
import { positionFromEccentricAnomaly } from './orbitalMechanics'
import type { MutableVector3 } from './orbitalMechanics'
import { createSeededRandom } from './seededRandom'
import { ENERGY_VERTEX, POINT_FRAGMENT } from './universeShaders'
import { useUniverseRuntime } from './universeRuntime'
import type { ScenePlanet } from './universeRuntime'

interface OrbitEnergyParticlesProps {
  planets: readonly ScenePlanet[]
  perOrbit: number
}

interface EnergyParticle {
  planet: ScenePlanet
  initialAnomaly: number
  speed: number
}

/** A few tiny sparks gliding along the orbital paths once they are drawn. */
export function OrbitEnergyParticles({
  planets,
  perOrbit,
}: OrbitEnergyParticlesProps) {
  const runtimeRef = useUniverseRuntime()
  const pointsRef = useRef<Points>(null)
  const materialRef = useRef<ShaderMaterial>(null)
  const anomaliesRef = useRef<Float32Array>(new Float32Array(0))
  const pointRef = useRef<MutableVector3>({ x: 0, y: 0, z: 0 })

  const { particles, geometry } = useMemo(() => {
    const random = createSeededRandom(9107)
    const list: EnergyParticle[] = []
    for (const planet of planets) {
      for (let i = 0; i < perOrbit; i += 1) {
        list.push({
          planet,
          initialAnomaly: random() * Math.PI * 2,
          speed: 0.05 + random() * 0.07,
        })
      }
    }
    const sizes = new Float32Array(list.length)
    for (let i = 0; i < list.length; i += 1) sizes[i] = 1.2 + random() * 1.4
    const bufferGeometry = new BufferGeometry()
    bufferGeometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(list.length * 3), 3),
    )
    bufferGeometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
    bufferGeometry.setAttribute(
      'aVisible',
      new BufferAttribute(new Float32Array(list.length), 1),
    )
    return { particles: list, geometry: bufferGeometry }
  }, [planets, perOrbit])

  const uniforms = useMemo(
    () => ({
      uPixelRatio: { value: 1 },
      uOpacity: { value: 0 },
      uColor: { value: new Color(UNIVERSE_PALETTE.goldenGlow) },
    }),
    [],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state, delta) => {
    const runtime = runtimeRef.current
    const material = materialRef.current
    const points = pointsRef.current
    if (!material || !points) return

    const energy = getOrbitEnergy(runtime.formation)
    material.uniforms.uOpacity.value = energy * 0.85
    material.uniforms.uPixelRatio.value = state.viewport.dpr
    points.visible = energy > 0
    if (energy <= 0) return

    if (anomaliesRef.current.length !== particles.length) {
      anomaliesRef.current = Float32Array.from(
        particles,
        (particle) => particle.initialAnomaly,
      )
    }
    const anomalies = anomaliesRef.current
    const point = pointRef.current
    const positions = points.geometry.getAttribute('position')
    const visibility = points.geometry.getAttribute('aVisible')
    const step = runtime.reducedMotion ? 0 : Math.min(delta, 0.1)

    particles.forEach((particle, index) => {
      anomalies[index] += particle.speed * step
      positionFromEccentricAnomaly(
        particle.planet.elements,
        anomalies[index],
        point,
      )
      positions.setXYZ(index, point.x, point.y, point.z)
      const drawn = getOrbitDraw(
        runtime.formation,
        particle.planet.orbitIndex,
        planets.length,
      )
      visibility.setX(index, drawn >= 1 ? 1 : 0)
    })
    positions.needsUpdate = true
    visibility.needsUpdate = true
  })

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      frustumCulled={false}
      renderOrder={2}
      visible={false}
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={ENERGY_VERTEX}
        fragmentShader={POINT_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
