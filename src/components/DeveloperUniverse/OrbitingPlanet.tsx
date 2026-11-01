import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { AdditiveBlending, Color, Mesh, Vector3 } from 'three'
import type {
  BufferGeometry,
  Group,
  Material,
  Points,
  ShaderMaterial,
  Sprite,
  Texture,
} from 'three'
import { UNIVERSE_PALETTE } from './developerUniverse.constants'
import type { PlanetEntrance } from './developerUniverse.types'
import {
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  segment,
} from './formationTimeline'
import { useOrbitalMotion } from './useOrbitalMotion'
import {
  CONVERGE_VERTEX,
  PLANET_FRAGMENT,
  PLANET_VERTEX,
  POINT_FRAGMENT,
} from './universeShaders'
import { useUniverseRuntime } from './universeRuntime'
import type { ScenePlanet } from './universeRuntime'
import type { ScreenCircle } from './developerUniverse.types'

interface OrbitingPlanetProps {
  scenePlanet: ScenePlanet
  planetCount: number
  interactive: boolean
  sphere: BufferGeometry
  hitMaterial: Material
  convergeGeometry: BufferGeometry
  logoTexture: Texture
  glowTexture: Texture
  onHover: (
    id: string | null,
    anchor?: ScreenCircle,
    leavingId?: string,
  ) => void
  onSelect: (id: string) => void
}

const SURFACE_INDEX = { banded: 0, rocky: 1, smooth: 2, crystalline: 3 }
const noRaycast = () => {}

function pointerTypeOf(event: { nativeEvent: Event }): string {
  const native = event.nativeEvent
  return 'pointerType' in native && typeof native.pointerType === 'string'
    ? native.pointerType
    : 'mouse'
}

/** Scale (from ~0.2 to 1) and opacity for the planet's arrival style. */
function arrival(style: PlanetEntrance, e: number) {
  if (style === 'scale') {
    return { scale: 0.2 + 0.8 * easeOutBack(e), opacity: segment(e, 0, 0.35) }
  }
  if (style === 'fade') {
    return { scale: 0.2 + 0.8 * easeOutCubic(e), opacity: easeInOutCubic(e) }
  }
  const body = segment(e, 0.35, 1)
  return {
    scale: 0.2 + 0.8 * easeOutCubic(body),
    opacity: segment(e, 0.4, 1),
  }
}

/**
 * One technology planet: a lit, textured sphere with its mark projected on
 * the camera-facing side, a soft glow, and an enlarged invisible hit sphere
 * for comfortable hover and tap targets.
 */
export function OrbitingPlanet({
  scenePlanet,
  planetCount,
  interactive,
  sphere,
  hitMaterial,
  convergeGeometry,
  logoTexture,
  glowTexture,
  onHover,
  onSelect,
}: OrbitingPlanetProps) {
  const runtimeRef = useUniverseRuntime()
  const { planet, size } = scenePlanet
  const groupRef = useRef<Group>(null)
  const bodyRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial>(null)
  const hitRef = useRef<Mesh>(null)
  const glowRef = useRef<Sprite>(null)
  const convergeRef = useRef<Points>(null)
  const convergeMaterialRef = useRef<ShaderMaterial>(null)
  const sunViewRef = useRef(new Vector3())

  useOrbitalMotion(scenePlanet, planetCount, groupRef)

  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(planet.color) },
      uRimColor: { value: new Color(UNIVERSE_PALETTE.goldenGlow) },
      uSunView: { value: new Vector3() },
      uLogo: { value: logoTexture },
      uLogoScale: { value: 1.3 },
      uLogoReveal: { value: 0 },
      uHighlight: { value: 0 },
      uOpacity: { value: 0 },
      uSurface: { value: SURFACE_INDEX[planet.surface] },
      uSeed: { value: (planet.orbitalPhase % 97) * 0.37 },
    }),
    [planet.color, planet.surface, planet.orbitalPhase, logoTexture],
  )
  const glowColour = useMemo(
    () =>
      new Color(planet.logoColor).lerp(
        new Color(UNIVERSE_PALETTE.goldenGlow),
        0.35,
      ),
    [planet.logoColor],
  )
  const convergeUniforms = useMemo(
    () => ({
      uEntrance: { value: 0 },
      uSpread: { value: 1.6 + size * 2 },
      uPixelRatio: { value: 1 },
      uColor: { value: new Color(UNIVERSE_PALETTE.goldenGlow) },
    }),
    [size],
  )

  // Never leave a pointer cursor behind if the planet unmounts mid-hover.
  useEffect(
    () => () => {
      document.body.style.removeProperty('cursor')
    },
    [],
  )

  useFrame((state) => {
    const runtime = runtimeRef.current
    const planetState = runtime.planets.get(planet.id)
    const group = groupRef.current
    const body = bodyRef.current
    const material = materialRef.current
    if (!planetState || !group || !body || !material) return

    const e = planetState.entrance
    group.visible = e > 0.0005
    if (!group.visible) return

    const { scale, opacity } = arrival(planet.entrance, e)
    const highlight = planetState.highlight
    body.scale.setScalar(size * scale * (1 + 0.18 * highlight))

    const sunView = sunViewRef.current
    sunView
      .copy(runtime.sunPosition)
      .applyMatrix4(state.camera.matrixWorldInverse)
    material.uniforms.uSunView.value.copy(sunView)
    material.uniforms.uOpacity.value = opacity
    material.uniforms.uHighlight.value = highlight
    material.uniforms.uLogoReveal.value = segment(e, 0.3, 0.85)

    const glow = glowRef.current
    if (glow) {
      glow.scale.setScalar(size * scale * (3 + 0.8 * highlight))
      glow.material.opacity =
        (0.14 + 0.4 * highlight + 0.45 * Math.sin(Math.PI * e)) * opacity
    }

    const hit = hitRef.current
    if (hit) {
      hit.scale.setScalar(size * runtime.layout.hitScale)
      hit.raycast = runtime.interactive ? Mesh.prototype.raycast : noRaycast
    }

    const converge = convergeRef.current
    const convergeMaterial = convergeMaterialRef.current
    if (converge && convergeMaterial) {
      converge.visible = e > 0 && e < 1
      convergeMaterial.uniforms.uEntrance.value = e
      convergeMaterial.uniforms.uPixelRatio.value = state.viewport.dpr
    }
  })

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const runtime = runtimeRef.current
    if (!interactive || runtime.dragging) return
    if (pointerTypeOf(event) !== 'mouse') return
    onHover(planet.id, {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      r: 18,
    })
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    if (pointerTypeOf(event) !== 'mouse') return
    onHover(null, undefined, planet.id)
    document.body.style.removeProperty('cursor')
  }

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (!interactive || event.delta > 8) return
    // Mouse users explore by hovering; touch and pen users tap to select.
    if (pointerTypeOf(event) === 'mouse') return
    onSelect(planet.id)
  }

  return (
    <group ref={groupRef} visible={false}>
      <sprite ref={glowRef} renderOrder={2}>
        <spriteMaterial
          map={glowTexture}
          color={glowColour}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          opacity={0}
        />
      </sprite>
      <mesh ref={bodyRef} geometry={sphere} renderOrder={3}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={PLANET_VERTEX}
          fragmentShader={PLANET_FRAGMENT}
          uniforms={uniforms}
          transparent
        />
      </mesh>
      <mesh
        ref={hitRef}
        geometry={sphere}
        material={hitMaterial}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
      {planet.entrance === 'particles' && (
        <points
          ref={convergeRef}
          geometry={convergeGeometry}
          frustumCulled={false}
          renderOrder={2}
        >
          <shaderMaterial
            ref={convergeMaterialRef}
            vertexShader={CONVERGE_VERTEX}
            fragmentShader={POINT_FRAGMENT}
            uniforms={convergeUniforms}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </points>
      )}
    </group>
  )
}
