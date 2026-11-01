import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  BufferAttribute,
  BufferGeometry,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import type { MotionValue } from 'motion/react'
import { CentralSun } from './CentralSun'
import { UNIVERSE_PALETTE } from './developerUniverse.constants'
import type {
  ScreenCircle,
  UniverseFrame,
  UniverseLayout,
} from './developerUniverse.types'
import { getSpaceState } from './formationTimeline'
import { orbitApoapsis } from './orbitalMechanics'
import { OrbitEnergyParticles } from './OrbitEnergyParticles'
import { OrbitingPlanet } from './OrbitingPlanet'
import { OrbitPath } from './OrbitPath'
import { createSeededRandom } from './seededRandom'
import { Starfield } from './Starfield'
import { SwirlParticles } from './SwirlParticles'
import { UniverseControls } from './UniverseControls'
import {
  UniverseRuntimeContext,
  createUniverseRuntime,
  useUniverseRuntime,
} from './universeRuntime'
import type { ScenePlanet, UniverseRuntime } from './universeRuntime'
import { createGlowTexture, createLogoTexture } from './universeTextures'
import type { LogoTexture } from './universeTextures'

export interface UniverseSceneProps {
  active?: boolean
  planets: readonly ScenePlanet[]
  layout: UniverseLayout
  /** Smoothed formation progress, 0 → 1. */
  formation: MotionValue<number>
  /** Reframing as the Impact overlays appear, 0 → 1. */
  reframe: MotionValue<number>
  insets: { top: number; bottom: number }
  reducedMotion: boolean
  activeId: string | null
  interactive: boolean
  onHover: (
    id: string | null,
    anchor?: ScreenCircle,
    leavingId?: string,
  ) => void
  onSelect: (id: string) => void
  onMiss: () => void
  onFrame: (frame: UniverseFrame) => void
  onContextLost: () => void
  onReady: () => void
}

export interface DeveloperUniverseDebug {
  state: () => {
    formation: number
    interactive: boolean
    activeId: string | null
    sun: ScreenCircle
  }
  planets: () => Array<
    ScreenCircle & {
      id: string
      entrance: number
      meanAnomaly: number
      speedFactor: number
      highlight: number
    }
  >
}

declare global {
  interface Window {
    __DEVELOPER_UNIVERSE__?: DeveloperUniverseDebug
  }
}

const getDustReveal = (runtime: UniverseRuntime) =>
  getSpaceState(runtime.formation).dust

const CONVERGE_PARTICLES = 40

function createConvergeGeometry(): BufferGeometry {
  const random = createSeededRandom(5150)
  const offsets = new Float32Array(CONVERGE_PARTICLES * 3)
  const sizes = new Float32Array(CONVERGE_PARTICLES)
  const delays = new Float32Array(CONVERGE_PARTICLES)
  for (let i = 0; i < CONVERGE_PARTICLES; i += 1) {
    const u = random() * 2 - 1
    const theta = random() * Math.PI * 2
    const ring = Math.sqrt(1 - u * u)
    const distance = 0.35 + random() * 0.65
    offsets[i * 3] = ring * Math.cos(theta) * distance
    offsets[i * 3 + 1] = u * distance
    offsets[i * 3 + 2] = ring * Math.sin(theta) * distance
    sizes[i] = 1 + random() * 1.6
    delays[i] = random()
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(CONVERGE_PARTICLES * 3), 3),
  )
  geometry.setAttribute('aOffset', new BufferAttribute(offsets, 3))
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
  geometry.setAttribute('aDelay', new BufferAttribute(delays, 1))
  return geometry
}

function useProjector() {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const vectors = useRef({
    centre: new Vector3(),
    edge: new Vector3(),
    right: new Vector3(),
  })

  return useCallback(
    (position: Vector3, radius: number, out: ScreenCircle) => {
      const { centre, edge, right } = vectors.current
      right.setFromMatrixColumn(camera.matrixWorld, 0)
      centre.copy(position).project(camera)
      edge.copy(position).addScaledVector(right, radius).project(camera)
      out.x = ((centre.x + 1) / 2) * size.width
      out.y = ((1 - centre.y) / 2) * size.height
      out.r = Math.hypot(
        ((edge.x - centre.x) / 2) * size.width,
        ((edge.y - centre.y) / 2) * size.height,
      )
      return out
    },
    [camera, size],
  )
}

/** Keeps the shared runtime in step with React props and the scroll value. */
function RuntimeDriver({
  formation,
  reducedMotion,
  activeId,
  interactive,
}: Pick<
  UniverseSceneProps,
  'formation' | 'reducedMotion' | 'activeId' | 'interactive'
>) {
  const runtimeRef = useUniverseRuntime()

  useLayoutEffect(() => {
    runtimeRef.current.activeId = activeId
  }, [runtimeRef, activeId])
  useLayoutEffect(() => {
    runtimeRef.current.interactive = interactive
  }, [runtimeRef, interactive])

  useFrame((_, delta) => {
    const runtime = runtimeRef.current
    runtime.reducedMotion = reducedMotion
    runtime.formation = reducedMotion ? 1 : formation.get()
    if (!reducedMotion) runtime.time += Math.min(delta, 0.1)
  })
  return null
}

/** Projects the sun and the active planet to screen space for the HTML overlays. */
function FrameReporter({
  planets,
  onFrame,
}: Pick<UniverseSceneProps, 'planets' | 'onFrame'>) {
  const runtimeRef = useUniverseRuntime()
  const project = useProjector()
  const sizes = useMemo(
    () => new Map(planets.map((item) => [item.planet.id, item.size])),
    [planets],
  )
  const frameRef = useRef<UniverseFrame>({
    width: 0,
    height: 0,
    sun: { x: 0, y: 0, r: 0 },
    planet: null,
  })
  const planetCircleRef = useRef<ScreenCircle>({ x: 0, y: 0, r: 0 })

  useFrame((state) => {
    const runtime = runtimeRef.current
    const frame = frameRef.current
    frame.width = state.size.width
    frame.height = state.size.height
    project(runtime.sunPosition, runtime.sunRadius, frame.sun)
    const activeId = runtime.activeId
    const active = activeId ? runtime.planets.get(activeId) : undefined
    if (activeId && active && active.entrance > 0) {
      const radius =
        (sizes.get(activeId) ?? 0.3) * (1 + 0.18 * active.highlight)
      frame.planet = project(active.position, radius, planetCircleRef.current)
    } else {
      frame.planet = null
    }
    onFrame(frame)
  })

  // Development-only hook used by the browser verification scripts.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__DEVELOPER_UNIVERSE__ = {
      state: () => ({
        formation: runtimeRef.current.formation,
        interactive: runtimeRef.current.interactive,
        activeId: runtimeRef.current.activeId,
        sun: { ...frameRef.current.sun },
      }),
      planets: () =>
        planets.map(({ planet, size: radius }) => {
          const state = runtimeRef.current.planets.get(planet.id)
          const circle = project(state?.position ?? new Vector3(), radius, {
            x: 0,
            y: 0,
            r: 0,
          })
          return {
            id: planet.id,
            ...circle,
            entrance: state?.entrance ?? 0,
            meanAnomaly: state?.meanAnomaly ?? 0,
            speedFactor: state?.speedFactor ?? 0,
            highlight: state?.highlight ?? 0,
          }
        }),
    }
    return () => {
      delete window.__DEVELOPER_UNIVERSE__
    }
  }, [planets, project, runtimeRef])

  return null
}

function SceneContents(props: UniverseSceneProps) {
  const { planets, layout, onHover, onSelect } = props
  const glowTexture = useMemo(() => createGlowTexture(), [])
  const planetSphere = useMemo(() => new SphereGeometry(1, 40, 28), [])
  const hitMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
      }),
    [],
  )
  const convergeGeometry = useMemo(() => createConvergeGeometry(), [])
  const logoTextures = useMemo(() => {
    const textures = new Map<string, LogoTexture>()
    for (const { planet } of planets) {
      textures.set(planet.id, createLogoTexture(planet.logo, planet.logoColor))
    }
    return textures
  }, [planets])
  const systemRadius = useMemo(
    () =>
      Math.max(
        ...planets.map((item) => orbitApoapsis(item.elements) + item.size),
        layout.sunRadius * 2,
      ),
    [planets, layout.sunRadius],
  )

  useEffect(() => {
    let cancelled = false
    // Wordmarks are drawn with Space Grotesk; redraw once it is available.
    document.fonts
      ?.load('700 96px "Space Grotesk"')
      .then(() => {
        if (cancelled) return
        logoTextures.forEach((logo) => logo.redraw())
      })
      .catch(() => {})
    return () => {
      cancelled = true
      logoTextures.forEach((logo) => logo.texture.dispose())
    }
  }, [logoTextures])

  useEffect(
    () => () => {
      glowTexture.dispose()
      planetSphere.dispose()
      hitMaterial.dispose()
      convergeGeometry.dispose()
    },
    [glowTexture, planetSphere, hitMaterial, convergeGeometry],
  )

  return (
    <>
      <RuntimeDriver
        formation={props.formation}
        reducedMotion={props.reducedMotion}
        activeId={props.activeId}
        interactive={props.interactive}
      />
      <UniverseControls
        systemRadius={systemRadius}
        reframe={props.reframe}
        insets={props.insets}
        interactive={props.interactive}
      />
      <Starfield count={layout.quality.stars} />
      <SwirlParticles
        count={layout.quality.dust}
        seed={7331}
        radius={[3, systemRadius * 1.15]}
        distribution="disc"
        heightSpread={0.7}
        speed={[0.006, 0.03]}
        size={[0.6, 1.9]}
        colours={[UNIVERSE_PALETTE.goldenGlow, UNIVERSE_PALETTE.secondaryGlow]}
        opacity={0.5}
        getReveal={getDustReveal}
      />
      <CentralSun
        glowTexture={glowTexture}
        segments={layout.quality.sphereSegments}
        particleCount={layout.quality.sunParticles}
      />
      {planets.map((item) => (
        <OrbitPath
          key={`orbit-${item.planet.id}`}
          scenePlanet={item}
          orbitCount={planets.length}
        />
      ))}
      {layout.quality.orbitParticlesPerOrbit > 0 && (
        <OrbitEnergyParticles
          planets={planets}
          perOrbit={layout.quality.orbitParticlesPerOrbit}
        />
      )}
      {planets.map((item) => {
        const logo = logoTextures.get(item.planet.id)
        if (!logo) return null
        return (
          <OrbitingPlanet
            key={item.planet.id}
            scenePlanet={item}
            planetCount={planets.length}
            interactive={props.interactive}
            sphere={planetSphere}
            hitMaterial={hitMaterial}
            convergeGeometry={convergeGeometry}
            logoTexture={logo.texture}
            glowTexture={glowTexture}
            onHover={onHover}
            onSelect={onSelect}
          />
        )
      })}
      <FrameReporter planets={planets} onFrame={props.onFrame} />
    </>
  )
}

/** The WebGL universe. Loaded lazily so three.js stays out of the first paint. */
export function UniverseScene(props: UniverseSceneProps) {
  const {
    active = true,
    layout,
    planets,
    reducedMotion,
    onMiss,
    onContextLost,
  } = props
  const runtimeRef = useRef<UniverseRuntime>(
    createUniverseRuntime(planets, layout, reducedMotion),
  )

  // A new layout (e.g. crossing a breakpoint) resolves new orbits.
  useEffect(() => {
    if (runtimeRef.current.layout === layout) return
    runtimeRef.current = createUniverseRuntime(planets, layout, reducedMotion)
  }, [planets, layout, reducedMotion])

  return (
    <Canvas
      className="developer-universe__canvas"
      frameloop={active ? 'always' : 'never'}
      flat
      dpr={[1, layout.quality.maxDpr]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: layout.fov, near: 0.1, far: 500, position: [0, 8, 34] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault()
          onContextLost()
        })
        props.onReady()
      }}
      onPointerMissed={() => {
        if (performance.now() - runtimeRef.current.lastDragEndedAt < 150) return
        onMiss()
      }}
    >
      <UniverseRuntimeContext.Provider value={runtimeRef}>
        <SceneContents {...props} />
      </UniverseRuntimeContext.Provider>
    </Canvas>
  )
}
