import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'

/* ── Helpers ── */
function hexToVec3(hex: string): THREE.Vector3 {
  const n = parseInt(hex.slice(1), 16)
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  )
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clampValue(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/* ── Configuration ── */
const CONFIG = {
  bgColor: '#0a0804',
  flameColor: '#b26b1e',
  flameColor2: '#f2cc4c',
  flameAmt: 0.15,
  atmoColor: '#d8a533',
  atmoCount: 450,
  atmoSize: 24,
  atmoSpeed: 1.0,
  coreColor: '#2d1907',
  midColor: '#b26b1e',
  rimColor: '#f2cc4c',
  opacity: 2,
  pointSize: 80,
  brightness: 1.6,
  spin: 0.03,
  repelRadius: 1.4,
  repelStrength: 4,
  parallax: 0.7,
  particleCount: 14000,
  sphereRadius: 2.5,
} as const

/* ── Mobile-responsive scaling ── */
function getMobileScale(): {
  particleCount: number
  pointSize: number
  atmoCount: number
  atmoSize: number
  sphereRadius: number
  repelRadius: number
} {
  const w = window.innerWidth
  const h = window.innerHeight
  const minDim = Math.min(w, h)

  // Phones (< 640px width or < 500px min dimension)
  if (w < 640 || minDim < 500) {
    return {
      particleCount: Math.round(CONFIG.particleCount * 0.35),
      pointSize: CONFIG.pointSize * 0.55,
      atmoCount: Math.round(CONFIG.atmoCount * 0.4),
      atmoSize: CONFIG.atmoSize * 0.7,
      sphereRadius: CONFIG.sphereRadius * 0.85,
      repelRadius: CONFIG.repelRadius * 0.8,
    }
  }

  // Tablets (640–1023px)
  if (w < 1024) {
    return {
      particleCount: Math.round(CONFIG.particleCount * 0.6),
      pointSize: CONFIG.pointSize * 0.75,
      atmoCount: Math.round(CONFIG.atmoCount * 0.65),
      atmoSize: CONFIG.atmoSize * 0.85,
      sphereRadius: CONFIG.sphereRadius * 0.92,
      repelRadius: CONFIG.repelRadius * 0.9,
    }
  }

  // Desktop — full values
  return {
    particleCount: CONFIG.particleCount,
    pointSize: CONFIG.pointSize,
    atmoCount: CONFIG.atmoCount,
    atmoSize: CONFIG.atmoSize,
    sphereRadius: CONFIG.sphereRadius,
    repelRadius: CONFIG.repelRadius,
  }
}

const LAYERS = {
  NONE: 0,
  TORUS_SCENE: 1,
  BLOOM_SCENE: 2,
  ENTIRE_SCENE: 3,
} as const

/* ── GLSL Shaders ── */
const stormVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uBlowUp;
  uniform vec3 uCursor;
  uniform float uRepelRadius;
  uniform float uRepelStrength;
  uniform float uActivity;
  uniform vec3 uCore;
  uniform vec3 uMid;
  uniform vec3 uRim;

  attribute float aScale;
  attribute float aNoise;
  attribute float aRadialPush;
  attribute float aMix;

  varying vec3 vColor;
  varying float vBlowUp;

  void main() {
    vec3 pos = position;

    // Per-particle in/out wobble
    float t = uTime * 1.4 + aNoise * 6.2831;
    float wobble = sin(t) * 0.1 * aRadialPush;
    pos *= 1.0 + wobble;

    // Slow secondary swirl on xz
    float swirlAngle = uTime * 0.05 + aNoise * 6.2831;
    mat2 swirl = mat2(
      cos(swirlAngle), -sin(swirlAngle),
      sin(swirlAngle), cos(swirlAngle)
    );
    pos.xz = swirl * pos.xz;

    // Blow-up — radial explosion with squared falloff
    vec3 outward = normalize(pos + vec3(0.0001));
    float blow = uBlowUp * uBlowUp;
    pos += outward * blow * (10.0 + aNoise * 18.0) * aRadialPush;

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);

    vec3 toParticle = modelPosition.xyz - uCursor;
    float dist = length(toParticle);
    float falloff = smoothstep(uRepelRadius, 0.0, dist);
    modelPosition.xyz += normalize(toParticle + vec3(0.0001))
      * falloff * uRepelStrength * uActivity;

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uSize * aScale;
    gl_PointSize *= (1.0 / -viewPosition.z);

    // Three-stop radial gradient
    float t1 = smoothstep(0.25, 0.85, aMix);
    vec3 mix1 = mix(uCore, uMid, t1);
    float t2 = clamp((aMix - 0.7) * 3.0, 0.0, 1.0);
    vColor = mix(mix1, uRim, t2);
    vBlowUp = uBlowUp;
  }
`

const stormFragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uBrightness;
  varying vec3 vColor;
  varying float vBlowUp;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float strength = pow(1.0 - d * 2.0, 4.5);
    vec3 color = mix(vec3(0.0), vColor, strength);
    float blowFade = 1.0 - smoothstep(0.15, 1.0, vBlowUp);
    gl_FragColor = vec4(color * uBrightness, strength * uOpacity * blowFade);
  }
`

const atmoVertexShader = /* glsl */ `
  attribute float size;
  attribute float seed;
  uniform float uTime;
  uniform vec2 uRes;
  varying float vA;

  vec3 warp(vec3 p, float t) {
    float c = 0.9, a = 1.9, b = 0.02, s = 0.05;
    p *= 2.0;
    p.x += c * sin(s * t + a * p.y) + t * b;
    p.y += c * cos(s * t + a * p.x);
    p.y += c * sin(s * t + a * p.z) + t * b;
    p.z += c * cos(s * t + a * p.y);
    p.z += c * sin(s * t + a * p.x) + t * b;
    p.x += c * cos(s * t + a * p.z);
    return cos(p + vec3(1, 2, 4));
  }

  void main() {
    vec3 v = position * 4.0 + warp(position, uTime) * 1.2;
    vec4 mv = modelViewMatrix * vec4(v, 1.0);
    float r = length(v);
    float farF = 1.0 - smoothstep(5.0, 6.5, r);
    float nearF = smoothstep(0.0, 0.5, -mv.z);
    vA = farF * nearF;
    gl_PointSize = size * uRes.y / 900.0 / -mv.z;
    gl_PointSize = max(gl_PointSize, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`

const atmoFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vA;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float l = length(p);
    if (l > 0.5) discard;
    float tex = smoothstep(0.5, 0.0, l);
    gl_FragColor = vec4(uColor * tex, tex * vA * 0.6);
  }
`

const finalPassVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const finalPassFragmentShader = /* glsl */ `
  uniform float iTime;
  uniform sampler2D tDiffuse;
  uniform sampler2D bloomTexture;
  uniform sampler2D torusTexture;
  uniform sampler2D haloTexture;
  uniform vec3 uBg;
  uniform vec3 uFlameA;
  uniform vec3 uFlameB;
  uniform float uFlameAmt;
  varying vec2 vUv;

  vec3 warp3d(vec3 pos, float t) {
    float curv = 0.8, a = 1.9, b = 0.7;
    pos *= 2.0;
    pos.x += curv * sin(t + a * pos.y) + t * b;
    pos.y += curv * cos(t + a * pos.x);
    pos.y += curv * sin(t + a * pos.z) + t * b;
    pos.z += curv * cos(t + a * pos.y);
    pos.z += curv * sin(t + a * pos.x) + t * b;
    pos.x += curv * cos(t + a * pos.z);
    return 0.5 + 0.5 * cos(pos.xyz + vec3(1, 2, 4));
  }

  void main() {
    vec2 uv = 2.0 * vUv - 1.0;
    vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime * 1.5), vec3(1.5));
    vec3 flame = 1.5 * uFlameA * w.x;
    flame *= w.y;
    flame += uFlameB * w.z;
    flame *= smoothstep(0.25, 1.0, abs(uv.y));
    float md = smoothstep(-0.7, 1.0, -uv.y * uv.x);
    flame *= md * md;
    vec3 bg = uBg * (1.0 - 0.4 * length(uv));
    vec3 halo = texture2D(haloTexture, vUv).xyz;
    gl_FragColor = vec4(
      bg
        + flame * uFlameAmt
        + texture2D(bloomTexture, vUv).xyz
        + texture2D(torusTexture, vUv).xyz
        + texture2D(tDiffuse, vUv).xyz
        + halo,
      1.0
    );
  }
`

/* ── Types ── */
interface StormSplashProps {
  /** Called once the Three.js scene is initialised and rendering. */
  onReady?: () => void
}

interface PointerState {
  ndc: THREE.Vector2
  world: THREE.Vector3
  activity: number
  active: boolean
  lastMove: number
}

/* ── Component ── */
export function StormSplash({ onReady }: StormSplashProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const disposeRef = useRef<(() => void) | null>(null)
  const readyFired = useRef(false)

  const handleReady = useCallback(() => {
    if (readyFired.current) return
    readyFired.current = true
    onReady?.()
  }, [onReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    /* ── Ensure canvas has explicit pixel dimensions before WebGL init ── */
    const dpr = Math.min(window.devicePixelRatio, 2)
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr

    /* ── Mobile-responsive values ── */
    const mobile = getMobileScale()

    /* ── Renderer ── */
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      })
    } catch {
      console.warn('StormSplash: WebGL context unavailable — skipping.')
      handleReady()
      return
    }
    renderer.setPixelRatio(dpr)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.VSMShadowMap

    /* ── Scene & Camera ── */
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    scene.fog = new THREE.Fog(0x000000, 0, 15)

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      80,
    )
    camera.position.set(0, 0, 7)
    camera.layers.enable(LAYERS.TORUS_SCENE)
    camera.layers.enable(LAYERS.BLOOM_SCENE)
    camera.layers.enable(LAYERS.ENTIRE_SCENE)
    scene.add(camera)

    /* ── Storm Points Geometry ── */
    const count = mobile.particleCount
    const radius = mobile.sphereRadius
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const noises = new Float32Array(count)
    const radialPush = new Float32Array(count)
    const mixv = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      let u: number, v: number, s: number
      do {
        u = Math.random() * 2 - 1
        v = Math.random() * 2 - 1
        s = u * u + v * v
      } while (s >= 1 || s === 0)

      const factor = 2 * Math.sqrt(1 - s)
      const dx = u * factor
      const dy = v * factor
      const dz = 1 - 2 * s
      const rN = Math.pow(Math.random(), 0.4)
      const r = radius * (0.55 + rN * 0.45)
      positions[i3] = dx * r
      positions[i3 + 1] = dy * r
      positions[i3 + 2] = dz * r
      mixv[i] = rN
      scales[i] = 0.45 + Math.random() * 0.8
      noises[i] = Math.random()
      radialPush[i] = 0.4 + rN * 1.1
    }

    const stormGeo = new THREE.BufferGeometry()
    stormGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    )
    stormGeo.setAttribute(
      'aScale',
      new THREE.Float32BufferAttribute(scales, 1),
    )
    stormGeo.setAttribute(
      'aNoise',
      new THREE.Float32BufferAttribute(noises, 1),
    )
    stormGeo.setAttribute(
      'aRadialPush',
      new THREE.Float32BufferAttribute(radialPush, 1),
    )
    stormGeo.setAttribute(
      'aMix',
      new THREE.Float32BufferAttribute(mixv, 1),
    )

    /* ── Storm Material ── */
    const stormUniforms = {
      uTime: { value: 0 },
      uSize: { value: mobile.pointSize },
      uOpacity: { value: 0 },
      uBlowUp: { value: 0 },
      uCursor: { value: new THREE.Vector3() },
      uRepelRadius: { value: mobile.repelRadius },
      uRepelStrength: { value: CONFIG.repelStrength },
      uActivity: { value: 0 },
      uCore: { value: hexToVec3(CONFIG.coreColor) },
      uMid: { value: hexToVec3(CONFIG.midColor) },
      uRim: { value: hexToVec3(CONFIG.rimColor) },
      uBrightness: { value: CONFIG.brightness },
    }

    const stormMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: stormUniforms,
      vertexShader: stormVertexShader,
      fragmentShader: stormFragmentShader,
    })

    const stormPoints = new THREE.Points(stormGeo, stormMat)
    stormPoints.layers.enable(LAYERS.ENTIRE_SCENE)

    const stormGroup = new THREE.Group()
    stormGroup.add(stormPoints)
    scene.add(stormGroup)

    /* ── Atmosphere Motes ── */
    const atmoN = mobile.atmoCount
    const atmoPositions = new Float32Array(atmoN * 3)
    const atmoSizes = new Float32Array(atmoN)
    const atmoSeeds = new Float32Array(atmoN)

    for (let i = 0; i < atmoN; i++) {
      atmoPositions[i * 3] = 2 * Math.random() - 1
      atmoPositions[i * 3 + 1] = 2 * Math.random() - 1
      atmoPositions[i * 3 + 2] = 2 * Math.random() - 1
      atmoSizes[i] = mobile.atmoSize * (0.4 + Math.random())
      atmoSeeds[i] = Math.random()
    }

    const atmoGeo = new THREE.BufferGeometry()
    atmoGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(atmoPositions, 3),
    )
    atmoGeo.setAttribute(
      'size',
      new THREE.Float32BufferAttribute(atmoSizes, 1),
    )
    atmoGeo.setAttribute(
      'seed',
      new THREE.Float32BufferAttribute(atmoSeeds, 1),
    )

    const atmoMat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: hexToVec3(CONFIG.atmoColor) },
        uRes: {
          value: new THREE.Vector2(
            window.innerWidth * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio,
          ),
        },
      },
      vertexShader: atmoVertexShader,
      fragmentShader: atmoFragmentShader,
    })

    const atmoPts = new THREE.Points(atmoGeo, atmoMat)
    atmoPts.frustumCulled = false
    atmoPts.layers.enable(LAYERS.ENTIRE_SCENE)
    scene.add(atmoPts)

    /* ── FinalPass Shader ── */
    const FinalPass = {
      uniforms: {
        iTime: { value: 0 },
        tDiffuse: { value: null as THREE.Texture | null },
        torusTexture: { value: null as THREE.Texture | null },
        bloomTexture: { value: null as THREE.Texture | null },
        haloTexture: { value: null as THREE.Texture | null },
        uBg: { value: hexToVec3(CONFIG.bgColor) },
        uFlameA: { value: hexToVec3(CONFIG.flameColor) },
        uFlameB: { value: hexToVec3(CONFIG.flameColor2) },
        uFlameAmt: { value: CONFIG.flameAmt },
      },
      vertexShader: finalPassVertexShader,
      fragmentShader: finalPassFragmentShader,
    }

    /* ── Postprocessing ── */
    const renderScene = new RenderPass(scene, camera)
    const windowSize = new THREE.Vector2(
      window.innerWidth,
      window.innerHeight,
    )

    // torusComposer
    const torusComposer = new EffectComposer(renderer)
    torusComposer.renderToScreen = false
    torusComposer.addPass(renderScene)
    torusComposer.addPass(new ShaderPass(GammaCorrectionShader))
    torusComposer.addPass(new UnrealBloomPass(windowSize, 0.22, 0.2, 0))
    torusComposer.addPass(new ShaderPass(CopyShader))

    // bloomComposer
    const bloomComposer = new EffectComposer(renderer)
    bloomComposer.renderToScreen = false
    bloomComposer.addPass(renderScene)
    bloomComposer.addPass(new UnrealBloomPass(windowSize, 0.4, 0.55, 0))
    bloomComposer.addPass(new ShaderPass(GammaCorrectionShader))

    // finalComposer
    const finalComposer = new EffectComposer(renderer)
    finalComposer.addPass(renderScene)
    const finalPass = new ShaderPass(FinalPass)
    finalPass.uniforms['bloomTexture'].value =
      bloomComposer.renderTarget1.texture
    finalPass.uniforms['torusTexture'].value =
      torusComposer.renderTarget1.texture

    // Empty halo texture placeholder
    const emptyTex = new THREE.DataTexture(
      new Uint8Array(4),
      1,
      1,
      THREE.RGBAFormat,
    )
    emptyTex.needsUpdate = true
    finalPass.uniforms['haloTexture'].value = emptyTex
    finalComposer.addPass(finalPass)

    /* ── Pointer tracking ── */
    const pointer: PointerState = {
      ndc: new THREE.Vector2(0, 0),
      world: new THREE.Vector3(),
      activity: 0,
      active: false,
      lastMove: performance.now(),
    }

    const _ndc = new THREE.Vector3()
    const _dir = new THREE.Vector3()
    const _target = new THREE.Vector3()

    function updatePointer(): void {
      _target.set(0, 0, 0)
      if (pointer.active) {
        _ndc.set(pointer.ndc.x, pointer.ndc.y, 0.5).unproject(camera)
        _dir.copy(_ndc).sub(camera.position).normalize()
        const denom = _dir.z
        if (Math.abs(denom) > 1e-4) {
          const t = -camera.position.z / denom
          if (t > 0 && Number.isFinite(t)) {
            _target.copy(camera.position).addScaledVector(_dir, t)
          }
        }
      }
      pointer.world.lerp(_target, 0.12)
      const idle = (performance.now() - pointer.lastMove) / 1000
      const want = pointer.active && idle < 3 ? 1 : 0
      pointer.activity += (want - pointer.activity) * 0.06
    }

    function onMouseMove(e: MouseEvent): void {
      pointer.ndc.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.ndc.y = -((e.clientY / window.innerHeight) * 2 - 1)
      pointer.active = true
      pointer.lastMove = performance.now()
    }

    function onMouseOut(): void {
      pointer.active = false
    }

    // Touch support for mobile
    function onTouchMove(e: TouchEvent): void {
      const touch = e.touches[0]
      if (!touch) return
      pointer.ndc.x = (touch.clientX / window.innerWidth) * 2 - 1
      pointer.ndc.y = -((touch.clientY / window.innerHeight) * 2 - 1)
      pointer.active = true
      pointer.lastMove = performance.now()
    }

    function onTouchEnd(): void {
      pointer.active = false
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mouseout', onMouseOut, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    /* ── Mouse smooth ── */
    const mouseSmooth = { x: 0, y: 0 }

    /* ── Appear timing ── */
    const appearStart = performance.now()
    let t0 = performance.now() / 1000

    /* ── Atmosphere onBeforeRender ── */
    atmoPts.onBeforeRender = () => {
      const t = performance.now() / 1000
      atmoMat.uniforms.uTime.value = t * CONFIG.atmoSpeed * 8.0
      atmoPts.position.copy(camera.position)
      finalPass.uniforms['iTime'].value = t
    }

    /* ── Resize handler ── */
    function onResize(): void {
      const resizeCanvas = canvasRef.current
      if (!resizeCanvas) return
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      const dpr = Math.min(window.devicePixelRatio, 2)
      resizeCanvas.width = w * dpr
      resizeCanvas.height = h * dpr
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h)
      torusComposer.setPixelRatio(dpr)
      torusComposer.setSize(w, h)
      bloomComposer.setPixelRatio(dpr)
      bloomComposer.setSize(w, h)
      finalComposer.setPixelRatio(dpr)
      finalComposer.setSize(w, h)
      atmoMat.uniforms.uRes.value.set(w * dpr, h * dpr)
    }

    window.addEventListener('resize', onResize)

    /* ── Animation loop ── */
    let frameId = 0
    let hasNotifiedReady = false

    function render(): void {
      frameId = requestAnimationFrame(render)

      mouseSmooth.x = lerp(mouseSmooth.x, pointer.ndc.x, 0.06)
      mouseSmooth.y = lerp(mouseSmooth.y, pointer.ndc.y, 0.06)
      updatePointer()

      const t = performance.now() / 1000
      const dt = Math.min(0.05, t - t0)
      t0 = t

      stormUniforms.uTime.value = t

      // Subtle parallax from mouse (no scroll — splash is a fixed overlay)
      camera.position.set(
        mouseSmooth.x * CONFIG.parallax,
        mouseSmooth.y * CONFIG.parallax,
        7,
      )
      camera.lookAt(0, 0, 0)

      // Fade in
      const elapsed = performance.now() - appearStart
      const fade = clampValue((elapsed - 300) / 1400, 0, 1)
      stormUniforms.uOpacity.value = fade * CONFIG.opacity
      stormUniforms.uBlowUp.value = 0
      stormUniforms.uCursor.value.copy(pointer.world)
      stormUniforms.uActivity.value = pointer.activity

      stormGroup.rotation.y += dt * CONFIG.spin
      stormGroup.rotation.x += dt * CONFIG.spin * 0.33

      // Composite render
      camera.layers.set(LAYERS.TORUS_SCENE)
      torusComposer.render()
      camera.layers.set(LAYERS.BLOOM_SCENE)
      bloomComposer.render()
      camera.layers.set(LAYERS.ENTIRE_SCENE)
      finalComposer.render()

      // Signal ready after the first frame renders
      if (!hasNotifiedReady && fade > 0) {
        hasNotifiedReady = true
        handleReady()
      }
    }

    render()

    /* ── Cleanup ── */
    const cleanup = (): void => {
      cancelAnimationFrame(frameId)

      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('resize', onResize)

      // Dispose geometries
      stormGeo.dispose()
      atmoGeo.dispose()

      // Dispose materials
      stormMat.dispose()
      atmoMat.dispose()

      // Dispose render targets and composers
      torusComposer.dispose()
      bloomComposer.dispose()
      finalComposer.dispose()

      // Dispose textures
      emptyTex.dispose()

      // Dispose renderer (do NOT call forceContextLoss — it permanently
      // invalidates the canvas, breaking React StrictMode double-mount)
      renderer.dispose()
    }

    disposeRef.current = cleanup

    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleReady])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'block',
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
    />
  )
}
