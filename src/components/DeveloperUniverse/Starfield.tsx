import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color } from 'three'
import type { Points, ShaderMaterial } from 'three'
import { STAR_SEED, UNIVERSE_PALETTE } from './developerUniverse.constants'
import { getSpaceState } from './formationTimeline'
import { createSeededRandom } from './seededRandom'
import { POINT_FRAGMENT, STAR_VERTEX } from './universeShaders'
import { useUniverseRuntime } from './universeRuntime'

interface StarfieldProps {
  count: number
}

function createStarGeometry(count: number): BufferGeometry {
  const random = createSeededRandom(STAR_SEED)
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const brightness = new Float32Array(count)
  const speeds = new Float32Array(count)
  const phases = new Float32Array(count)
  const thresholds = new Float32Array(count)
  const twinkles = new Float32Array(count)
  const colours = new Float32Array(count * 3)
  const white = new Color('#ffffff')
  const warm = new Color(UNIVERSE_PALETTE.starWarm)
  const cool = new Color(UNIVERSE_PALETTE.starCool)
  const gold = new Color(UNIVERSE_PALETTE.goldenGlow)
  const colour = new Color()

  for (let i = 0; i < count; i += 1) {
    // Uniform direction on a sphere, distributed through a deep shell.
    const u = random() * 2 - 1
    const theta = random() * Math.PI * 2
    const radius = 70 + random() ** 0.7 * 110
    const ring = Math.sqrt(1 - u * u)
    positions[i * 3] = ring * Math.cos(theta) * radius
    positions[i * 3 + 1] = u * radius * 0.82
    positions[i * 3 + 2] = ring * Math.sin(theta) * radius

    const bright = random()
    sizes[i] = 0.7 + bright ** 3 * 2.4
    brightness[i] = 0.25 + bright * 0.75
    speeds[i] = 0.35 + random() * 2.1
    phases[i] = random() * Math.PI * 2
    thresholds[i] = random() * 0.88
    twinkles[i] = random() < 0.65 ? 0.3 + random() * 0.7 : 0.08

    const tint = random()
    if (tint < 0.07) colour.copy(gold)
    else if (tint < 0.22) colour.copy(white).lerp(warm, 0.6)
    else if (tint < 0.42) colour.copy(white).lerp(cool, 0.7)
    else colour.copy(white)
    colours[i * 3] = colour.r
    colours[i * 3 + 1] = colour.g
    colours[i * 3 + 2] = colour.b
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
  geometry.setAttribute('aBrightness', new BufferAttribute(brightness, 1))
  geometry.setAttribute('aSpeed', new BufferAttribute(speeds, 1))
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
  geometry.setAttribute('aThreshold', new BufferAttribute(thresholds, 1))
  geometry.setAttribute('aTwinkle', new BufferAttribute(twinkles, 1))
  geometry.setAttribute('aColor', new BufferAttribute(colours, 3))
  return geometry
}

/**
 * A deterministic, deep star shell. Stars fade in progressively with the
 * formation and blink at independent frequencies.
 */
export function Starfield({ count }: StarfieldProps) {
  const runtimeRef = useUniverseRuntime()
  const pointsRef = useRef<Points>(null)
  const materialRef = useRef<ShaderMaterial>(null)
  const geometry = useMemo(() => createStarGeometry(count), [count])
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uPixelRatio: { value: 1 },
    }),
    [],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    const runtime = runtimeRef.current
    const material = materialRef.current
    if (!material) return
    material.uniforms.uTime.value = runtime.time
    material.uniforms.uReveal.value = getSpaceState(runtime.formation).stars
    material.uniforms.uPixelRatio.value = state.viewport.dpr
    const points = pointsRef.current
    if (points && !runtime.reducedMotion) {
      // Slow drift through space.
      points.rotation.y = runtime.time * 0.0045
      points.rotation.x = Math.sin(runtime.time * 0.01) * 0.02
    }
  })

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      frustumCulled={false}
      renderOrder={0}
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={STAR_VERTEX}
        fragmentShader={POINT_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
