import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color } from 'three'
import type { ShaderMaterial } from 'three'
import { createSeededRandom } from './seededRandom'
import { POINT_FRAGMENT, SWIRL_VERTEX } from './universeShaders'
import { useUniverseRuntime } from './universeRuntime'
import type { UniverseRuntime } from './universeRuntime'

interface SwirlParticlesProps {
  count: number
  seed: number
  radius: readonly [number, number]
  /** 'disc' spreads particles near the orbital plane; 'shell' wraps a sphere. */
  distribution: 'disc' | 'shell'
  heightSpread: number
  speed: readonly [number, number]
  size: readonly [number, number]
  colours: readonly [string, string]
  opacity: number
  getReveal: (runtime: UniverseRuntime) => number
}

function createSwirlGeometry({
  count,
  seed,
  radius,
  distribution,
  heightSpread,
  speed,
  size,
}: Omit<SwirlParticlesProps, 'colours' | 'opacity' | 'getReveal'>) {
  const random = createSeededRandom(seed)
  const radii = new Float32Array(count)
  const angles = new Float32Array(count)
  const heights = new Float32Array(count)
  const speeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)

  for (let i = 0; i < count; i += 1) {
    const r = radius[0] + random() * (radius[1] - radius[0])
    if (distribution === 'shell') {
      const cosPolar = random() * 2 - 1
      const ring = Math.sqrt(1 - cosPolar * cosPolar)
      radii[i] = r * ring
      heights[i] = r * cosPolar * heightSpread
    } else {
      radii[i] = r
      // Gaussian-like thickness keeps most dust close to the plane.
      heights[i] = (random() + random() + random() - 1.5) * heightSpread
    }
    angles[i] = random() * Math.PI * 2
    speeds[i] =
      (speed[0] + random() * (speed[1] - speed[0])) *
      (random() < 0.5 ? 1 : 0.85)
    sizes[i] = size[0] + random() ** 2 * (size[1] - size[0])
    phases[i] = random() * Math.PI * 2
  }

  const geometry = new BufferGeometry()
  // Positions are computed in the shader; this attribute only sets the count.
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(count * 3), 3),
  )
  geometry.setAttribute('aRadius', new BufferAttribute(radii, 1))
  geometry.setAttribute('aAngle', new BufferAttribute(angles, 1))
  geometry.setAttribute('aHeight', new BufferAttribute(heights, 1))
  geometry.setAttribute('aSpeed', new BufferAttribute(speeds, 1))
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
  return geometry
}

/** Particles revolving around the vertical axis: golden dust or the sun's corona. */
export function SwirlParticles({
  count,
  seed,
  radius,
  distribution,
  heightSpread,
  speed,
  size,
  colours,
  opacity,
  getReveal,
}: SwirlParticlesProps) {
  const runtimeRef = useUniverseRuntime()
  const materialRef = useRef<ShaderMaterial>(null)
  const [radiusMin, radiusMax] = radius
  const [speedMin, speedMax] = speed
  const [sizeMin, sizeMax] = size
  const [colourA, colourB] = colours

  const geometry = useMemo(
    () =>
      createSwirlGeometry({
        count,
        seed,
        radius: [radiusMin, radiusMax],
        distribution,
        heightSpread,
        speed: [speedMin, speedMax],
        size: [sizeMin, sizeMax],
      }),
    [
      count,
      seed,
      radiusMin,
      radiusMax,
      distribution,
      heightSpread,
      speedMin,
      speedMax,
      sizeMin,
      sizeMax,
    ],
  )
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uOpacity: { value: opacity },
      uPixelRatio: { value: 1 },
      uColorA: { value: new Color(colourA) },
      uColorB: { value: new Color(colourB) },
    }),
    [colourA, colourB, opacity],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    const material = materialRef.current
    if (!material) return
    const runtime = runtimeRef.current
    material.uniforms.uTime.value = runtime.time
    material.uniforms.uReveal.value = getReveal(runtime)
    material.uniforms.uPixelRatio.value = state.viewport.dpr
  })

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={SWIRL_VERTEX}
        fragmentShader={POINT_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
