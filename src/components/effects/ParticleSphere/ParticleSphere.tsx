import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from 'motion/react'
import { getSphereTransitionFrame } from './sphere-transition'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Base particle count — enough for a dense, cohesive sphere surface */
const BASE_PARTICLE_COUNT = 10000
const HALO_PARTICLE_COUNT = 400
const SPHERE_RADIUS = 2.8

/** Inner zone gets ~72 % of particles, tightly packed at the sphere surface */
const INNER_RATIO = 0.72

/** Outer zone starts just beyond the sphere and extends outward */
const OUTER_MIN_RADIUS = 3.2
const OUTER_MAX_RADIUS = 3.9

// ---------------------------------------------------------------------------
// Interaction state — shared between Canvas event handlers and R3F children
// ---------------------------------------------------------------------------

interface InteractionState {
  /** Current mouse position projected onto the sphere (world space) */
  mouse: THREE.Vector3
  /** Whether the mouse is currently over the sphere */
  mouseActive: boolean
  /** World-space origin of the most recent click */
  clickOrigin: THREE.Vector3
  /** Monotonic time of the most recent click (seconds) */
  clickTime: number
}

interface SphereMotionState {
  rotationMultiplier: number
}

export type ParticleSpherePhase = 'splash' | 'transitioning' | 'hero'

const SPHERE_TRANSITION_SECONDS = 1.9

// ---------------------------------------------------------------------------
// Responsive particle scaling
// ---------------------------------------------------------------------------

function getResponsiveConfig() {
  if (typeof window === 'undefined') {
    return {
      particleScale: 1,
      haloScale: 1,
      dpr: 1,
      cameraZ: 8,
      fov: 50,
      pointSizeScale: 1,
      brightnessBoost: 1,
    }
  }
  const w = window.innerWidth
  const dpr = Math.min(window.devicePixelRatio, 2)
  if (w < 640) {
    // Mobile: pull camera back and widen FOV so the full sphere (radius 2.8)
    // fits within the narrow portrait viewport with some breathing room.
    // At cameraZ=11, fov=65 the visible horizontal half-width ≈ 3.13
    return {
      particleScale: 1,
      haloScale: 0.7,
      dpr: Math.min(dpr, 1.5),
      cameraZ: 11,
      fov: 65,
      pointSizeScale: 1,
      brightnessBoost: 1.2,
    }
  }
  if (w < 1024) {
    // Tablet: slightly pull back camera so sphere fits portrait orientations.
    // At cameraZ=10, fov=55 the visible horizontal half-width ≈ 3.47
    return {
      particleScale: 0.85,
      haloScale: 0.7,
      dpr: Math.min(dpr, 1.5),
      cameraZ: 10,
      fov: 55,
      pointSizeScale: 1,
      brightnessBoost: 1.1,
    }
  }
  return {
    particleScale: 1,
    haloScale: 1,
    dpr,
    cameraZ: 8,
    fov: 50,
    pointSizeScale: 1,
    brightnessBoost: 1,
  }
}

// ---------------------------------------------------------------------------
// Vertex shader — dual-zone particles with breathing, repulsion & click wave
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uReducedMotion;
  uniform vec3  uMouse;
  uniform float uMouseActive;
  uniform vec3  uClickOrigin;
  uniform float uClickTime;
  uniform float uPointSizeScale;
  uniform float uResolution;

  attribute float aSize;
  attribute float aPhase;
  attribute float aBrightness;
  attribute float aZone;         // 0.0 = inner, 1.0 = outer

  varying float vBrightness;
  varying vec3  vWorldPos;
  varying float vZone;

  void main() {
    vBrightness = aBrightness;
    vZone       = aZone;

    vec3 pos    = position;
    vec3 normal = normalize(position);

    // ---- Continuous breathing (disabled for reduced motion) ---------------
    if (uReducedMotion < 0.5) {
      // Each particle breathes at its own phase — slow, smooth drift out & back
      float breathe = sin(uTime * 0.6 + aPhase * 6.283) * 0.12
                    + sin(uTime * 0.35 + aPhase * 3.0)  * 0.08;
      pos += normal * breathe;

      // Subtle wave deformation
      float wave = sin(pos.x * 2.0 + uTime * 0.4 + aPhase) * 0.06
                 + sin(pos.y * 3.0 + uTime * 0.3 + aPhase) * 0.04
                 + sin(pos.z * 1.5 + uTime * 0.5 + aPhase) * 0.05;
      pos += normal * wave;
    }

    // ---- Mouse repulsion -------------------------------------------------
    if (uMouseActive > 0.01) {
      vec3  toParticle = pos - uMouse;
      float dist       = length(toParticle);
      // Repulsion falls off with distance; stronger close up
      float repulse    = smoothstep(2.5, 0.0, dist) * 0.9 * uMouseActive;
      pos += normalize(toParticle) * repulse;
    }

    // ---- Click wave — single smooth pulse across the sphere surface -----
    float timeSinceClick = uTime - uClickTime;
    if (timeSinceClick > 0.0 && timeSinceClick < 6.0) {
      // Geodesic (angular) distance — wave follows the sphere surface
      vec3  nPos   = normalize(position);
      vec3  nClick = normalize(uClickOrigin);
      float gDist  = acos(clamp(dot(nPos, nClick), -1.0, 1.0));

      // Slow wave front — takes ~4 s to sweep the full sphere
      float waveSpeed = 0.8;
      float waveFront = waveSpeed * timeSinceClick;

      // Single Gaussian pulse — one smooth crest, no repeating oscillation
      float pulseWidth = 0.5;
      float pulse = exp(-pow(gDist - waveFront, 2.0)
                        / (2.0 * pulseWidth * pulseWidth));

      // Gentle decay with distance from click origin
      float decay = exp(-gDist * 0.35);

      // Smooth fade-out over the tail end
      float fade = 1.0 - smoothstep(4.0, 6.0, timeSinceClick);

      // Displace outward only — particles push out then settle back
      pos += normal * pulse * decay * fade * 0.45;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;

    // Uniform, extremely small particles — no per-particle size variation.
    float projScale = projectionMatrix[1][1] * uResolution * 0.5;
    gl_PointSize = clamp(
      uPointSizeScale * 0.018 * projScale / -mvPosition.z,
      1.0, 400.0
    );
    gl_Position  = projectionMatrix * mvPosition;
  }
`

// ---------------------------------------------------------------------------
// Fragment shader — golden-amber palette with directional lighting
// ---------------------------------------------------------------------------

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uReducedMotion;
  uniform float uBrightnessBoost;

  varying float vBrightness;
  varying vec3  vWorldPos;
  varying float vZone;

  void main() {
    // Circular point shape
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Compact point falloff — sharp dot with minimal soft edge
    float alpha = 1.0 - smoothstep(0.25, 0.5, dist);

    // Directional lighting from upper-left
    vec3  lightDir = normalize(vec3(-1.0, 0.8, 0.6));
    vec3  normal   = normalize(vWorldPos);
    float lighting = dot(normal, lightDir);
    float lit      = smoothstep(-0.1, 1.0, lighting);

    // Golden palette: warm gold on lit side, dark amber on shadow side
    vec3 brightGold = vec3(0.95, 0.8, 0.3);
    vec3 warmAmber  = vec3(0.7, 0.42, 0.12);
    vec3 deepShadow = vec3(0.18, 0.1, 0.03);

    vec3 color = mix(deepShadow, warmAmber, smoothstep(0.0, 0.5, lit));
    color      = mix(color, brightGold, smoothstep(0.5, 1.0, lit));

    // Per-particle brightness variation
    color *= vBrightness;

    // Inner-zone particles are slightly brighter for the dense-core look
    float zoneBright = mix(1.15, 0.85, vZone);
    color *= zoneBright;

    // Subtle brightness pulsation (disabled for reduced motion)
    if (uReducedMotion < 0.5) {
      float pulse = 0.93 + 0.07 * sin(uTime * 1.5 + vWorldPos.x * 3.0);
      color *= pulse;
    }

    gl_FragColor = vec4(color, alpha * vBrightness * 0.92 * uBrightnessBoost);
  }
`

// ---------------------------------------------------------------------------
// Halo vertex shader
// ---------------------------------------------------------------------------

const haloVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uReducedMotion;
  uniform float uPointSizeScale;
  uniform float uResolution;

  attribute float aSize;
  attribute float aPhase;
  attribute float aDrift;
  attribute float aBrightness;

  varying float vBrightness;

  void main() {
    vBrightness = aBrightness;

    vec3 pos = position;

    // Slow outward drift (disabled for reduced motion)
    if (uReducedMotion < 0.5) {
      float drift = sin(uTime * 0.15 + aPhase) * aDrift;
      pos += normalize(position) * drift;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float projScale = projectionMatrix[1][1] * uResolution * 0.5;
    gl_PointSize = clamp(
      uPointSizeScale * 0.012 * projScale / -mvPosition.z,
      1.0, 200.0
    );
    gl_Position = projectionMatrix * mvPosition;
  }
`

// ---------------------------------------------------------------------------
// Halo fragment shader
// ---------------------------------------------------------------------------

const haloFragmentShader = /* glsl */ `
  uniform float uBrightnessBoost;

  varying float vBrightness;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = 1.0 - smoothstep(0.25, 0.5, dist);

    // Warm golden glow for halo particles
    vec3 color = vec3(0.85, 0.65, 0.2) * vBrightness;

    gl_FragColor = vec4(color, alpha * vBrightness * 0.18 * uBrightnessBoost);
  }
`

// ---------------------------------------------------------------------------
// Sphere particles (main body) — dual-zone: inner dense + outer sparse
// ---------------------------------------------------------------------------

function SphereParticles({
  count,
  reducedMotion,
  interaction,
  motionState,
  pointSizeScale,
  brightnessBoost,
}: {
  count: number
  reducedMotion: boolean
  interaction: React.RefObject<InteractionState>
  motionState: React.RefObject<SphereMotionState>
  pointSizeScale: number
  brightnessBoost: number
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.ShaderMaterial | null>(null)

  // Smooth interpolation targets for mouse state
  const smoothMouse = useRef(new THREE.Vector3())
  const smoothMouseActive = useRef(0)

  useEffect(() => {
    const geometry = new THREE.BufferGeometry()

    const innerCount = Math.round(count * INNER_RATIO)
    const outerCount = count - innerCount

    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const brightnesses = new Float32Array(count)
    const zones = new Float32Array(count)

    // ---- Inner zone: Fibonacci sphere, tightly packed -------------------
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < innerCount; i++) {
      const theta = goldenAngle * i
      const y = 1 - (i / (innerCount - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      // Very tight radial variation — particles hug the sphere surface
      const r = SPHERE_RADIUS * (0.98 + Math.random() * 0.04)

      positions[i * 3] = Math.cos(theta) * radiusAtY * r
      positions[i * 3 + 1] = y * r
      positions[i * 3 + 2] = Math.sin(theta) * radiusAtY * r

      sizes[i] = 0.5 + Math.random() * 0.8
      phases[i] = Math.random() * Math.PI * 2
      brightnesses[i] = 0.55 + Math.random() * 0.45
      zones[i] = 0.0
    }

    // ---- Outer zone: random distribution, more spread out ---------------
    for (let i = 0; i < outerCount; i++) {
      const idx = innerCount + i
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = OUTER_MIN_RADIUS + Math.random() * (OUTER_MAX_RADIUS - OUTER_MIN_RADIUS)

      positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[idx * 3 + 2] = r * Math.cos(phi)

      sizes[idx] = 0.6 + Math.random() * 1.0
      phases[idx] = Math.random() * Math.PI * 2
      brightnesses[idx] = 0.35 + Math.random() * 0.45
      zones[idx] = 1.0
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('aBrightness', new THREE.BufferAttribute(brightnesses, 1))
    geometry.setAttribute('aZone', new THREE.BufferAttribute(zones, 1))

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uReducedMotion: { value: reducedMotion ? 1.0 : 0.0 },
        uMouse: { value: new THREE.Vector3() },
        uMouseActive: { value: 0 },
        uClickOrigin: { value: new THREE.Vector3() },
        uClickTime: { value: -10 },
        uPointSizeScale: { value: pointSizeScale },
        uBrightnessBoost: { value: brightnessBoost },
        uResolution: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    matRef.current = material

    if (pointsRef.current) {
      // Dispose previous geometry/material if they exist
      pointsRef.current.geometry.dispose()
      if (pointsRef.current.material instanceof THREE.Material) {
        pointsRef.current.material.dispose()
      }
      pointsRef.current.geometry = geometry
      pointsRef.current.material = material
    }

    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [count, reducedMotion, pointSizeScale, brightnessBoost])

  useFrame((state, delta) => {
    if (!pointsRef.current || !matRef.current) return
    const mat = matRef.current
    const ix = interaction.current

    // Viewport-proportional point sizing — adapts to any framebuffer resolution
    mat.uniforms.uResolution.value =
      state.size.height * state.gl.getPixelRatio()

    // Advance time
    mat.uniforms.uTime.value += delta

    // Smooth mouse position and activation
    const targetActive = ix.mouseActive ? 1 : 0
    smoothMouseActive.current += (targetActive - smoothMouseActive.current) * Math.min(delta * 6, 1)
    smoothMouse.current.lerp(ix.mouse, Math.min(delta * 8, 1))

    // Convert world-space input into local space, including the cinematic
    // parent transform and the sphere's continuous rotation.
    pointsRef.current.updateWorldMatrix(true, false)
    const localMouse = pointsRef.current.worldToLocal(
      smoothMouse.current.clone(),
    )

    mat.uniforms.uMouse.value.copy(localMouse)
    mat.uniforms.uMouseActive.value = smoothMouseActive.current

    // Click origin — also transform to local space
    if (ix.clickTime > mat.uniforms.uClickTime.value) {
      const localClick = pointsRef.current.worldToLocal(ix.clickOrigin.clone())
      mat.uniforms.uClickOrigin.value.copy(localClick)
      mat.uniforms.uClickTime.value = ix.clickTime
    }

    // Rotation — revolving like Earth
    const rotSpeed = reducedMotion ? 0.005 : 0.06
    pointsRef.current.rotation.y +=
      delta * rotSpeed * motionState.current.rotationMultiplier
  })

  return <points ref={pointsRef} />
}

// ---------------------------------------------------------------------------
// Halo particles (subtle surrounding cloud) — pushed outward to clear outer zone
// ---------------------------------------------------------------------------

function HaloParticles({
  count,
  reducedMotion,
  motionState,
  pointSizeScale,
  brightnessBoost,
}: {
  count: number
  reducedMotion: boolean
  motionState: React.RefObject<SphereMotionState>
  pointSizeScale: number
  brightnessBoost: number
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.ShaderMaterial | null>(null)

  useEffect(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const drifts = new Float32Array(count)
    const brightnesses = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      // Start beyond the outer zone
      const r = OUTER_MAX_RADIUS * (1.02 + Math.random() * 0.6)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      sizes[i] = 0.3 + Math.random() * 0.6
      phases[i] = Math.random() * Math.PI * 2
      drifts[i] = 0.15 + Math.random() * 0.4
      brightnesses[i] = 0.1 + Math.random() * 0.22
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 1))
    geometry.setAttribute('aBrightness', new THREE.BufferAttribute(brightnesses, 1))

    const material = new THREE.ShaderMaterial({
      vertexShader: haloVertexShader,
      fragmentShader: haloFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uReducedMotion: { value: reducedMotion ? 1.0 : 0.0 },
        uPointSizeScale: { value: pointSizeScale },
        uBrightnessBoost: { value: brightnessBoost },
        uResolution: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    matRef.current = material

    if (pointsRef.current) {
      pointsRef.current.geometry.dispose()
      if (pointsRef.current.material instanceof THREE.Material) {
        pointsRef.current.material.dispose()
      }
      pointsRef.current.geometry = geometry
      pointsRef.current.material = material
    }

    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [count, reducedMotion, pointSizeScale, brightnessBoost])

  useFrame((state, delta) => {
    if (!pointsRef.current || !matRef.current) return
    matRef.current.uniforms.uResolution.value =
      state.size.height * state.gl.getPixelRatio()
    matRef.current.uniforms.uTime.value += delta
    pointsRef.current.rotation.y +=
      delta *
      (reducedMotion ? 0.003 : 0.03) *
      motionState.current.rotationMultiplier
  })

  return <points ref={pointsRef} />
}

// ---------------------------------------------------------------------------
// Interaction mesh — invisible sphere for mouse/click raycasting
// ---------------------------------------------------------------------------

function InteractionMesh({
  interaction,
}: {
  interaction: React.RefObject<InteractionState>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const clockRef = useRef<THREE.Clock | null>(null)
  const { clock } = useThree()

  useEffect(() => {
    clockRef.current = clock
  }, [clock])

  return (
    <mesh
      ref={meshRef}
      visible={false}
      onPointerMove={(e) => {
        interaction.current.mouse.copy(e.point)
        interaction.current.mouseActive = true
      }}
      onPointerLeave={() => {
        interaction.current.mouseActive = false
      }}
      onClick={(e) => {
        interaction.current.clickOrigin.copy(e.point)
        if (clockRef.current) {
          interaction.current.clickTime = clockRef.current.elapsedTime
        }
      }}
    >
      <sphereGeometry args={[OUTER_MAX_RADIUS * 1.3, 32, 32]} />
      <meshBasicMaterial />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Scene — contains the sphere + halo + interaction mesh
// ---------------------------------------------------------------------------

function Scene({
  reducedMotion,
  interaction,
  phase,
  onTransitionComplete,
}: {
  reducedMotion: boolean
  interaction: React.RefObject<InteractionState>
  phase: ParticleSpherePhase
  onTransitionComplete: () => void
}) {
  const config = useMemo(() => getResponsiveConfig(), [])
  const groupRef = useRef<THREE.Group>(null)
  const motionState = useRef<SphereMotionState>({ rotationMultiplier: 1 })
  const transitionStart = useRef<number | null>(null)
  const transitionComplete = useRef(false)
  const onTransitionCompleteRef = useRef(onTransitionComplete)
  onTransitionCompleteRef.current = onTransitionComplete
  const sphereCount = Math.round(BASE_PARTICLE_COUNT * config.particleScale)
  const haloCount = Math.round(HALO_PARTICLE_COUNT * config.haloScale)

  useFrame((state) => {
    let progress = 0

    if (phase === 'splash') {
      transitionStart.current = null
      transitionComplete.current = false
    } else if (phase === 'hero') {
      progress = 1
      transitionStart.current = null
    } else {
      transitionStart.current ??= state.clock.elapsedTime
      progress = reducedMotion
        ? 1
        : Math.min(
            1,
            (state.clock.elapsedTime - transitionStart.current) /
              SPHERE_TRANSITION_SECONDS,
          )
    }

    const frame = getSphereTransitionFrame(progress, state.size.width, reducedMotion)
    if (groupRef.current) {
      groupRef.current.position.set(frame.offsetX, 0, 0)
      groupRef.current.scale.setScalar(frame.scale)
    }
    motionState.current.rotationMultiplier = frame.rotationMultiplier

    if (
      phase === 'transitioning' &&
      progress >= 1 &&
      !transitionComplete.current
    ) {
      transitionComplete.current = true
      onTransitionCompleteRef.current()
    }
  })

  return (
    <group ref={groupRef}>
      <InteractionMesh interaction={interaction} />
      <SphereParticles
        count={sphereCount}
        reducedMotion={reducedMotion}
        interaction={interaction}
        motionState={motionState}
        pointSizeScale={config.pointSizeScale}
        brightnessBoost={config.brightnessBoost}
      />
      <HaloParticles
        count={haloCount}
        reducedMotion={reducedMotion}
        motionState={motionState}
        pointSizeScale={config.pointSizeScale}
        brightnessBoost={config.brightnessBoost}
      />
    </group>
  )
}

// ---------------------------------------------------------------------------
// WebGL fallback — static golden sphere rendered with CSS
// ---------------------------------------------------------------------------

function StaticFallback({
  phase,
  reducedMotion,
  onReady,
  onTransitionComplete,
}: {
  phase: ParticleSpherePhase
  reducedMotion: boolean
  onReady: () => void
  onTransitionComplete: () => void
}) {
  const readyReported = useRef(false)
  const transitionReported = useRef(false)
  const onReadyRef = useRef(onReady)
  const onTransitionCompleteRef = useRef(onTransitionComplete)
  onReadyRef.current = onReady
  onTransitionCompleteRef.current = onTransitionComplete

  useEffect(() => {
    if (readyReported.current) return
    readyReported.current = true
    onReadyRef.current()
  }, [])

  useEffect(() => {
    if (
      phase !== 'transitioning' ||
      !reducedMotion ||
      transitionReported.current
    ) {
      return
    }

    transitionReported.current = true
    onTransitionCompleteRef.current()
  }, [phase, reducedMotion])

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      aria-hidden
    >
      <motion.div
        className="rounded-full"
        initial={false}
        animate={{ scale: phase === 'transitioning' ? 1.14 : 1 }}
        transition={{ duration: reducedMotion ? 0 : SPHERE_TRANSITION_SECONDS }}
        onAnimationComplete={() => {
          if (phase !== 'transitioning' || transitionReported.current) return
          transitionReported.current = true
          onTransitionCompleteRef.current()
        }}
        style={{
          width: 'min(60vw, 360px)',
          height: 'min(60vw, 360px)',
          background:
            'radial-gradient(circle at 35% 35%, #ffd966 0%, #cc8a22 40%, #4a2800 70%, #0a0500 100%)',
          boxShadow: '0 0 80px 20px rgba(255, 200, 60, 0.12)',
          opacity: 0.85,
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ParticleSphere — public component
// ---------------------------------------------------------------------------

interface ParticleSphereProps {
  /** When true, show a static or very slow sphere */
  reducedMotion?: boolean
  phase?: ParticleSpherePhase
  onReady?: () => void
  onTransitionComplete?: () => void
}

export function ParticleSphere({
  reducedMotion = false,
  phase = 'splash',
  onReady,
  onTransitionComplete,
}: ParticleSphereProps) {
  const config = useMemo(() => getResponsiveConfig(), [])
  const hasWebGL = useMemo(() => {
    try {
      const c = document.createElement('canvas')
      return !!(
        c.getContext('webgl2') ??
        c.getContext('webgl') ??
        c.getContext('experimental-webgl')
      )
    } catch {
      return false
    }
  }, [])

  // Interaction state lives outside the Canvas so onPointerLeave on the
  // Canvas element itself can deactivate mouse tracking
  const interactionRef = useRef<InteractionState>({
    mouse: new THREE.Vector3(),
    mouseActive: false,
    clickOrigin: new THREE.Vector3(),
    clickTime: -10,
  })
  const readyReported = useRef(false)
  const onReadyRef = useRef(onReady)
  const onTransitionCompleteRef = useRef(onTransitionComplete)
  onReadyRef.current = onReady
  onTransitionCompleteRef.current = onTransitionComplete

  const reportReady = useCallback(() => {
    if (readyReported.current) return
    readyReported.current = true
    onReadyRef.current?.()
  }, [])

  const handleCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      gl.setClearColor(0x000000, 1)
      gl.setPixelRatio(config.dpr)
      reportReady()
    },
    [config.dpr, reportReady],
  )

  const handlePointerLeave = useCallback(() => {
    interactionRef.current.mouseActive = false
  }, [])

  if (!hasWebGL) {
    return (
      <StaticFallback
        phase={phase}
        reducedMotion={reducedMotion}
        onReady={reportReady}
        onTransitionComplete={() => onTransitionCompleteRef.current?.()}
      />
    )
  }

  return (
    <Canvas
      camera={{ position: [0, 0, config.cameraZ], fov: config.fov }}
      dpr={config.dpr}
      gl={{ antialias: false, alpha: false, powerPreference: 'default' }}
      onCreated={handleCreated}
      onPointerLeave={handlePointerLeave}
      fallback={
        <StaticFallback
          phase={phase}
          reducedMotion={reducedMotion}
          onReady={reportReady}
          onTransitionComplete={() => onTransitionCompleteRef.current?.()}
        />
      }
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        background: '#000',
      }}
    >
      <Scene
        reducedMotion={reducedMotion}
        interaction={interactionRef}
        phase={phase}
        onTransitionComplete={() => onTransitionCompleteRef.current?.()}
      />
    </Canvas>
  )
}
