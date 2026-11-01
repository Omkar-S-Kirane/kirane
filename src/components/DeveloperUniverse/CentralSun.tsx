import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BackSide,
  Color,
  MathUtils,
  SphereGeometry,
} from 'three'
import type { Group, ShaderMaterial, Sprite, Texture } from 'three'
import { UNIVERSE_PALETTE } from './developerUniverse.constants'
import { getSunState } from './formationTimeline'
import { SwirlParticles } from './SwirlParticles'
import {
  ATMOSPHERE_FRAGMENT,
  ATMOSPHERE_VERTEX,
  SUN_FRAGMENT,
  SUN_VERTEX,
} from './universeShaders'
import { useUniverseRuntime } from './universeRuntime'
import type { UniverseRuntime } from './universeRuntime'

interface CentralSunProps {
  glowTexture: Texture
  segments: number
  particleCount: number
}

const getParticleReveal = (runtime: UniverseRuntime) =>
  getSunState(runtime.formation).particles

function GlowSprite({
  spriteRef,
  texture,
  colour,
  renderOrder,
}: {
  spriteRef: RefObject<Sprite | null>
  texture: Texture
  colour: string
  renderOrder: number
}) {
  return (
    <sprite ref={spriteRef} renderOrder={renderOrder}>
      <spriteMaterial
        map={texture}
        color={colour}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        opacity={0}
      />
    </sprite>
  )
}

/**
 * The developer at the centre of the universe: a golden, slowly rotating
 * star that travels in from the east and condenses out of a point of light.
 */
export function CentralSun({
  glowTexture,
  segments,
  particleCount,
}: CentralSunProps) {
  const runtimeRef = useUniverseRuntime()
  const anchorRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)
  const sunMaterialRef = useRef<ShaderMaterial>(null)
  const atmosphereMaterialRef = useRef<ShaderMaterial>(null)
  const lightRef = useRef<Sprite>(null)
  const innerHaloRef = useRef<Sprite>(null)
  const wideHaloRef = useRef<Sprite>(null)

  const sphere = useMemo(
    () => new SphereGeometry(1, segments, Math.round(segments * 0.75)),
    [segments],
  )
  const sunUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uForm: { value: 0 },
      uDetail: { value: 0 },
      uIntensity: { value: 1 },
      uDeep: { value: new Color(UNIVERSE_PALETTE.sunDeep) },
      uMid: { value: new Color(UNIVERSE_PALETTE.sun) },
      uHigh: { value: new Color(UNIVERSE_PALETTE.goldenGlow) },
      uHot: { value: new Color(UNIVERSE_PALETTE.sunHot) },
    }),
    [],
  )
  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new Color(UNIVERSE_PALETTE.goldenGlow) },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  )

  useEffect(() => () => sphere.dispose(), [sphere])

  useFrame((_, delta) => {
    const runtime = runtimeRef.current
    const anchor = anchorRef.current
    const body = bodyRef.current
    const sunMaterial = sunMaterialRef.current
    const atmosphereMaterial = atmosphereMaterialRef.current
    if (!anchor || !body || !sunMaterial || !atmosphereMaterial) return

    const state = getSunState(runtime.formation)
    const baseRadius = runtime.layout.sunRadius
    // Starts just beyond the east (right) edge, slightly low, then arcs to the centre.
    const startX = runtime.viewHalfWidth + baseRadius * 1.6
    const startY = -runtime.viewHalfHeight * 0.3
    anchor.position.set(
      MathUtils.lerp(startX, 0, state.travel),
      MathUtils.lerp(startY, 0, state.rise),
      0,
    )
    runtime.sunPosition.copy(anchor.position)

    const radius = baseRadius * state.scale
    runtime.sunRadius = radius
    body.scale.setScalar(radius)
    body.visible = state.form > 0.001
    if (!runtime.reducedMotion) body.rotation.y += Math.min(delta, 0.1) * 0.05

    const uniforms = sunMaterial.uniforms
    uniforms.uTime.value = runtime.time
    uniforms.uForm.value = state.form
    uniforms.uDetail.value = state.detail
    uniforms.uIntensity.value = 0.94 + 0.08 * state.form
    atmosphereMaterial.uniforms.uTime.value = runtime.time
    atmosphereMaterial.uniforms.uOpacity.value = state.halo * 0.9

    const light = lightRef.current
    if (light) {
      light.scale.setScalar(baseRadius * (1.2 + 2.6 * state.light))
      light.material.opacity = state.light * (1 - 0.6 * state.form)
    }
    const inner = innerHaloRef.current
    if (inner) {
      inner.scale.setScalar(radius * 3.1)
      inner.material.opacity = state.form * 0.5
    }
    const wide = wideHaloRef.current
    if (wide) {
      wide.scale.setScalar(radius * 7.5)
      wide.material.opacity = state.halo * 0.3
    }
  })

  return (
    <group ref={anchorRef}>
      <GlowSprite
        spriteRef={wideHaloRef}
        texture={glowTexture}
        colour={UNIVERSE_PALETTE.secondaryGlow}
        renderOrder={1}
      />
      <GlowSprite
        spriteRef={innerHaloRef}
        texture={glowTexture}
        colour={UNIVERSE_PALETTE.goldenGlow}
        renderOrder={1}
      />
      <GlowSprite
        spriteRef={lightRef}
        texture={glowTexture}
        colour={UNIVERSE_PALETTE.sunHot}
        renderOrder={4}
      />
      <group ref={bodyRef} visible={false}>
        <mesh geometry={sphere} renderOrder={3}>
          <shaderMaterial
            ref={sunMaterialRef}
            vertexShader={SUN_VERTEX}
            fragmentShader={SUN_FRAGMENT}
            uniforms={sunUniforms}
            transparent
          />
        </mesh>
        <mesh geometry={sphere} scale={1.2} renderOrder={2}>
          <shaderMaterial
            ref={atmosphereMaterialRef}
            vertexShader={ATMOSPHERE_VERTEX}
            fragmentShader={ATMOSPHERE_FRAGMENT}
            uniforms={atmosphereUniforms}
            side={BackSide}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
        <SwirlParticles
          count={particleCount}
          seed={4021}
          radius={[1.25, 2.1]}
          distribution="shell"
          heightSpread={0.9}
          speed={[0.04, 0.16]}
          size={[0.5, 1.7]}
          colours={[UNIVERSE_PALETTE.goldenGlow, UNIVERSE_PALETTE.sunHot]}
          opacity={0.75}
          getReveal={getParticleReveal}
        />
      </group>
    </group>
  )
}
