import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color } from 'three'
import type { LineSegments, Mesh, ShaderMaterial } from 'three'
import { UNIVERSE_PALETTE } from './developerUniverse.constants'
import { getOrbitDraw } from './formationTimeline'
import { sampleOrbitPath } from './orbitalMechanics'
import { ORBIT_FRAGMENT, ORBIT_VERTEX } from './universeShaders'
import { useUniverseRuntime } from './universeRuntime'
import type { ScenePlanet } from './universeRuntime'

interface OrbitPathProps {
  scenePlanet: ScenePlanet
  orbitCount: number
}

const SEGMENTS = 240
const BAND_WIDTH = 0.07
const WARM_CATEGORIES = new Set(['frontend', 'backend', 'versionControl'])

function createOrbitUniforms(
  colour: string,
  opacity: number,
  softEdge: number,
) {
  return {
    uColor: { value: new Color(colour) },
    uOpacity: { value: opacity },
    uDraw: { value: 0 },
    uPresence: { value: 0 },
    uHighlight: { value: 0 },
    uSoftEdge: { value: softEdge },
    uCameraDistance: { value: 30 },
    uRadius: { value: 5 },
  }
}

function createOrbitGeometries(points: Float32Array) {
  const count = points.length / 3
  const ts = new Float32Array(count)
  for (let i = 0; i < count; i += 1) ts[i] = i / (count - 1)

  const line = new BufferGeometry()
  line.setAttribute('position', new BufferAttribute(points, 3))
  line.setAttribute('aT', new BufferAttribute(ts, 1))
  line.setAttribute('aAcross', new BufferAttribute(new Float32Array(count), 1))
  const segments: number[] = []
  for (let i = 0; i < count - 1; i += 1) segments.push(i, i + 1)
  line.setIndex(segments)

  // A soft band in the orbital plane gives the thin line a glowing edge.
  const bandPositions = new Float32Array(count * 2 * 3)
  const bandT = new Float32Array(count * 2)
  const bandAcross = new Float32Array(count * 2)
  for (let i = 0; i < count; i += 1) {
    const x = points[i * 3]
    const y = points[i * 3 + 1]
    const z = points[i * 3 + 2]
    const length = Math.hypot(x, y, z) || 1
    for (let side = 0; side < 2; side += 1) {
      const offset = (side === 0 ? -1 : 1) * (BAND_WIDTH / 2)
      const index = i * 2 + side
      bandPositions[index * 3] = x + (x / length) * offset
      bandPositions[index * 3 + 1] = y + (y / length) * offset
      bandPositions[index * 3 + 2] = z + (z / length) * offset
      bandT[index] = ts[i]
      bandAcross[index] = side === 0 ? -1 : 1
    }
  }
  const indices: number[] = []
  for (let i = 0; i < count - 1; i += 1) {
    const a = i * 2
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  const band = new BufferGeometry()
  band.setAttribute('position', new BufferAttribute(bandPositions, 3))
  band.setAttribute('aT', new BufferAttribute(bandT, 1))
  band.setAttribute('aAcross', new BufferAttribute(bandAcross, 1))
  band.setIndex(indices)
  return { line, band }
}

/**
 * The visible trajectory of one planet: faint as the planet arrives, then
 * drawn on fully during the orbit phase, brighter while its planet is active.
 */
export function OrbitPath({ scenePlanet, orbitCount }: OrbitPathProps) {
  const runtimeRef = useUniverseRuntime()
  const { planet, elements, orbitIndex } = scenePlanet
  const colour = WARM_CATEGORIES.has(planet.category)
    ? UNIVERSE_PALETTE.orbitGold
    : UNIVERSE_PALETTE.orbitIvory
  const lineRef = useRef<LineSegments>(null)
  const bandRef = useRef<Mesh>(null)
  const lineMaterialRef = useRef<ShaderMaterial>(null)
  const bandMaterialRef = useRef<ShaderMaterial>(null)

  const geometries = useMemo(
    () => createOrbitGeometries(sampleOrbitPath(elements, SEGMENTS)),
    [elements],
  )
  const lineUniforms = useMemo(
    () => createOrbitUniforms(colour, 0.34, 0),
    [colour],
  )
  const bandUniforms = useMemo(
    () => createOrbitUniforms(colour, 0.13, 1),
    [colour],
  )

  useEffect(
    () => () => {
      geometries.line.dispose()
      geometries.band.dispose()
    },
    [geometries],
  )

  useFrame(() => {
    const runtime = runtimeRef.current
    const state = runtime.planets.get(planet.id)
    const draw = getOrbitDraw(runtime.formation, orbitIndex, orbitCount)
    const presence = state?.entrance ?? 0
    const highlight = state?.highlight ?? 0
    const visible = draw > 0 || presence > 0
    for (const material of [lineMaterialRef.current, bandMaterialRef.current]) {
      if (!material) continue
      material.uniforms.uDraw.value = draw
      material.uniforms.uPresence.value = presence
      material.uniforms.uHighlight.value = highlight
      material.uniforms.uCameraDistance.value = runtime.cameraDistance
      material.uniforms.uRadius.value = elements.semiMajorAxis
    }
    if (lineRef.current) lineRef.current.visible = visible
    if (bandRef.current) bandRef.current.visible = visible
  })

  return (
    <>
      <mesh
        ref={bandRef}
        geometry={geometries.band}
        frustumCulled={false}
        renderOrder={1}
        visible={false}
      >
        <shaderMaterial
          ref={bandMaterialRef}
          vertexShader={ORBIT_VERTEX}
          fragmentShader={ORBIT_FRAGMENT}
          uniforms={bandUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <lineSegments
        ref={lineRef}
        geometry={geometries.line}
        frustumCulled={false}
        renderOrder={1}
        visible={false}
      >
        <shaderMaterial
          ref={lineMaterialRef}
          vertexShader={ORBIT_VERTEX}
          fragmentShader={ORBIT_FRAGMENT}
          uniforms={lineUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </lineSegments>
    </>
  )
}
